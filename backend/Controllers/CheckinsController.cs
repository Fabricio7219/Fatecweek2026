using FatecWeekAPI.Data;
using FatecWeekAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FatecWeekAPI.Controllers;

[ApiController]
[Route("api/checkins")]
[Authorize]
public class CheckinsController(AppDbContext db) : ControllerBase
{
    public record EntradaRequest(
        int AlunoId, int EventoId,
        string TipoParticipacao,
        decimal? Latitude, decimal? Longitude,
        bool FaceValidado = false,
        string? FotoCheckin = null);

    public record SaidaRequest(decimal? Latitude, decimal? Longitude);

    // GET /api/checkins?eventoId=1&alunoId=2
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int? eventoId, [FromQuery] int? alunoId)
    {
        var query = db.Checkins
            .Include(c => c.Aluno)
            .Include(c => c.Evento)
            .AsQueryable();

        if (eventoId.HasValue) query = query.Where(c => c.EventoId == eventoId.Value);
        if (alunoId.HasValue)  query = query.Where(c => c.AlunoId  == alunoId.Value);

        var lista = await query.Select(c => new {
            c.Id,
            c.AlunoId,
            NomeAluno    = c.Aluno.NomeCompleto,
            Ra           = c.Aluno.Ra,
            c.EventoId,
            NomeEvento   = c.Evento.NomeEvento,
            c.HorarioEntrada,
            c.HorarioSaida,
            c.FaceValidado,
            c.TipoParticipacao,
            c.CreatedAt,
        }).ToListAsync();

        return Ok(lista);
    }

    // POST /api/checkins/entrada — registra entrada do aluno
    [HttpPost("entrada")]
    public async Task<IActionResult> RegistrarEntrada([FromBody] EntradaRequest req)
    {
        if (req.TipoParticipacao is not ("visitante" or "expositor"))
            return BadRequest(new { message = "TipoParticipacao deve ser 'visitante' ou 'expositor'." });

        // Verifica se já existe check-in para este aluno neste evento
        var existente = await db.Checkins
            .FirstOrDefaultAsync(c => c.AlunoId == req.AlunoId && c.EventoId == req.EventoId);

        if (existente is not null)
            return Conflict(new { message = "Aluno já possui check-in neste evento.", checkinId = existente.Id });

        if (!await db.Alunos.AnyAsync(a => a.Id == req.AlunoId))
            return BadRequest(new { message = "Aluno não encontrado." });

        if (!await db.Eventos.AnyAsync(e => e.Id == req.EventoId))
            return BadRequest(new { message = "Evento não encontrado." });

        var checkin = new Checkin
        {
            AlunoId          = req.AlunoId,
            EventoId         = req.EventoId,
            HorarioEntrada   = DateTime.Now,
            TipoParticipacao = req.TipoParticipacao,
            Latitude         = req.Latitude,
            Longitude        = req.Longitude,
            FaceValidado     = req.FaceValidado,
            FotoCheckin      = req.FotoCheckin,
        };

        db.Checkins.Add(checkin);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Listar), new { alunoId = checkin.AlunoId }, checkin);
    }

    // PATCH /api/checkins/{id}/saida — registra saída e pontua automaticamente
    [HttpPatch("{id}/saida")]
    public async Task<IActionResult> RegistrarSaida(int id, [FromBody] SaidaRequest req)
    {
        var checkin = await db.Checkins
            .Include(c => c.Evento)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (checkin is null) return NotFound();
        if (checkin.HorarioSaida is not null)
            return Conflict(new { message = "Saída já registrada." });

        checkin.HorarioSaida = DateTime.Now;
        if (req.Latitude.HasValue)  checkin.Latitude  = req.Latitude;
        if (req.Longitude.HasValue) checkin.Longitude = req.Longitude;

        // ─── Cálculo automático de pontuação ─────────────────────────────────
        decimal pontuacaoObtida = 0;
        bool    pontuou         = false;
        int     tempoMinutos    = 0;

        if (checkin.HorarioEntrada.HasValue)
        {
            tempoMinutos = (int)(checkin.HorarioSaida.Value - checkin.HorarioEntrada.Value).TotalMinutes;
            var evento   = checkin.Evento;

            // Concede pontos se ficou o tempo mínimo exigido (ou se não há mínimo configurado)
            if (tempoMinutos >= evento.TempoMinimoMinutos)
            {
                pontuacaoObtida = evento.Pontuacao;
                pontuou         = true;

                // Upsert na tabela pontuacoes
                var pontuacaoExistente = await db.Pontuacoes
                    .FirstOrDefaultAsync(p => p.AlunoId == checkin.AlunoId && p.EventoId == checkin.EventoId);

                if (pontuacaoExistente is null)
                {
                    db.Pontuacoes.Add(new Pontuacao
                    {
                        AlunoId         = checkin.AlunoId,
                        EventoId        = checkin.EventoId,
                        PontuacaoObtida = pontuacaoObtida,
                    });
                }
                else
                {
                    pontuacaoExistente.PontuacaoObtida = pontuacaoObtida;
                }
            }
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            checkin.Id,
            checkin.AlunoId,
            checkin.EventoId,
            checkin.HorarioEntrada,
            checkin.HorarioSaida,
            TempoPermancecidoMinutos = tempoMinutos,
            Pontuou                  = pontuou,
            PontuacaoObtida          = pontuacaoObtida,
            TempoMinimoExigido       = checkin.Evento.TempoMinimoMinutos,
            Mensagem                 = pontuou
                ? $"Presença válida! +{pontuacaoObtida} ponto(s) concedido(s)."
                : $"Tempo insuficiente ({tempoMinutos} min). Mínimo exigido: {checkin.Evento.TempoMinimoMinutos} min. Nenhum ponto concedido.",
        });
    }

    // GET /api/checkins/relatorio/{eventoId}
    [HttpGet("relatorio/{eventoId}")]
    public async Task<IActionResult> Relatorio(int eventoId)
    {
        var evento = await db.Eventos.FindAsync(eventoId);
        if (evento is null) return NotFound(new { message = "Evento não encontrado." });

        var checkins = await db.Checkins
            .Include(c => c.Aluno)
            .Where(c => c.EventoId == eventoId)
            .Select(c => new {
                c.Id,
                c.Aluno.Ra,
                NomeAluno        = c.Aluno.NomeCompleto,
                Curso            = c.Aluno.Curso,
                c.HorarioEntrada,
                c.HorarioSaida,
                c.FaceValidado,
                c.TipoParticipacao,
                TempoMinutos     = c.HorarioSaida.HasValue
                    ? (int)(c.HorarioSaida.Value - c.HorarioEntrada!.Value).TotalMinutes
                    : (int?)null,
            }).ToListAsync();

        return Ok(new {
            Evento     = evento.NomeEvento,
            Data       = evento.Data,
            Total      = checkins.Count,
            Checkins   = checkins,
        });
    }
}
