using FatecWeekAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FatecWeekAPI.Controllers;

[ApiController]
[Route("api/pontuacoes")]
[Authorize]
public class PontuacoesController(AppDbContext db) : ControllerBase
{
    // GET /api/pontuacoes/aluno/{ra}
    // Retorna todas as pontuações de um aluno com o total acumulado
    [HttpGet("aluno/{ra}")]
    public async Task<IActionResult> PorAluno(string ra)
    {
        var aluno = await db.Alunos.FirstOrDefaultAsync(a => a.Ra == ra);
        if (aluno is null) return NotFound(new { message = "Aluno não encontrado." });

        var pontuacoes = await db.Pontuacoes
            .Include(p => p.Evento)
            .Where(p => p.AlunoId == aluno.Id)
            .Select(p => new {
                p.EventoId,
                NomeEvento      = p.Evento.NomeEvento,
                Tipo            = p.Evento.Tipo,
                Data            = p.Evento.Data,
                p.PontuacaoObtida,
            })
            .OrderBy(p => p.Data)
            .ToListAsync();

        var total = pontuacoes.Sum(p => p.PontuacaoObtida);

        return Ok(new {
            Ra          = aluno.Ra,
            Nome        = aluno.NomeCompleto,
            Curso       = aluno.Curso,
            TotalPontos = total,
            Eventos     = pontuacoes,
        });
    }

    // GET /api/pontuacoes/ranking?eventoId=1
    // Ranking geral ou por evento
    [HttpGet("ranking")]
    public async Task<IActionResult> Ranking([FromQuery] int? eventoId)
    {
        var query = db.Pontuacoes
            .Include(p => p.Aluno)
            .Include(p => p.Evento)
            .AsQueryable();

        if (eventoId.HasValue)
            query = query.Where(p => p.EventoId == eventoId.Value);

        var dados = await query
            .GroupBy(p => new { p.AlunoId, p.Aluno.Ra, p.Aluno.NomeCompleto, p.Aluno.Curso })
            .Select(g => new {
                g.Key.Ra,
                Nome        = g.Key.NomeCompleto,
                Curso       = g.Key.Curso,
                TotalPontos = g.Sum(p => p.PontuacaoObtida),
                Eventos     = g.Count(),
            })
            .OrderByDescending(x => x.TotalPontos)
            .ToListAsync();

        return Ok(dados);
    }

    // GET /api/pontuacoes/evento/{eventoId}
    // Lista todos os alunos que pontuaram em um evento específico
    [HttpGet("evento/{eventoId}")]
    public async Task<IActionResult> PorEvento(int eventoId)
    {
        var evento = await db.Eventos.FindAsync(eventoId);
        if (evento is null) return NotFound(new { message = "Evento não encontrado." });

        var pontuacoes = await db.Pontuacoes
            .Include(p => p.Aluno)
            .Where(p => p.EventoId == eventoId)
            .Select(p => new {
                p.Aluno.Ra,
                Nome             = p.Aluno.NomeCompleto,
                Curso            = p.Aluno.Curso,
                p.PontuacaoObtida,
            })
            .OrderBy(p => p.Nome)
            .ToListAsync();

        return Ok(new {
            Evento      = evento.NomeEvento,
            Data        = evento.Data,
            Pontuacao   = evento.Pontuacao,
            TempoMinimo = evento.TempoMinimoMinutos,
            Total       = pontuacoes.Count,
            Alunos      = pontuacoes,
        });
    }

    // GET /api/pontuacoes/consolidado?eventoIds=1,2,3
    // Relatório consolidado: pontos por aluno discriminados por evento + total
    [HttpGet("consolidado")]
    public async Task<IActionResult> Consolidado([FromQuery] string eventoIds)
    {
        var ids = (eventoIds ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(x => int.TryParse(x.Trim(), out var n) ? n : 0)
            .Where(n => n > 0)
            .ToList();

        if (ids.Count == 0)
            return BadRequest(new { message = "Informe ao menos um eventoId." });

        var eventos = await db.Eventos
            .Where(e => ids.Contains(e.Id))
            .OrderBy(e => e.Data)
            .Select(e => new { e.Id, e.NomeEvento, Data = e.Data.ToString("dd/MM/yyyy"), e.Pontuacao })
            .ToListAsync();

        var pontuacoes = await db.Pontuacoes
            .Include(p => p.Aluno)
            .Where(p => ids.Contains(p.EventoId))
            .ToListAsync();

        var alunos = pontuacoes
            .GroupBy(p => new { p.AlunoId, p.Aluno.Ra, p.Aluno.NomeCompleto, p.Aluno.Curso, p.Aluno.Semestre, p.Aluno.Turno })
            .Select(g => new
            {
                g.Key.Ra,
                Nome             = g.Key.NomeCompleto,
                Curso            = g.Key.Curso ?? "Não informado",
                Semestre         = g.Key.Semestre ?? "—",
                Turno            = g.Key.Turno    ?? "—",
                PontosPorEvento  = eventos.Select(ev => new
                {
                    ev.Id,
                    ev.NomeEvento,
                    ev.Data,
                    Pontos = g.FirstOrDefault(p => p.EventoId == ev.Id)?.PontuacaoObtida ?? 0m,
                }).ToList(),
                TotalPontos = g.Sum(p => p.PontuacaoObtida),
            })
            .OrderByDescending(a => a.TotalPontos)
            .ToList();

        return Ok(new
        {
            Eventos    = eventos,
            TotalAlunos = alunos.Count,
            Alunos     = alunos,
        });
    }
}
