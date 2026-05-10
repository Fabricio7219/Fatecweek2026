using FatecWeekAPI.Data;
using FatecWeekAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FatecWeekAPI.Controllers;

[ApiController]
[Route("api/palestras")]
[Authorize]
public class PalestrasController(AppDbContext db) : ControllerBase
{
    public record PalestraRequest(
        int EventoId,
        string Titulo,
        string? Descricao,
        string Palestrante,
        string? Sala,
        DateTime? Inicio,
        DateTime? Fim,
        int TempoMinimoMinutos = 0,
        decimal Pontuacao = 0);

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int? eventoId)
    {
        var query = db.Palestras.AsQueryable();
        if (eventoId.HasValue)
            query = query.Where(p => p.EventoId == eventoId.Value);

        var lista = await query
            .OrderBy(p => p.Inicio)
            .Select(p => new {
                p.Id, p.EventoId, p.Titulo, p.Descricao,
                p.Palestrante, p.Sala, p.Inicio, p.Fim,
                p.TempoMinimoMinutos, p.Pontuacao, p.CreatedAt
            }).ToListAsync();
        return Ok(lista);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obter(int id)
    {
        var palestra = await db.Palestras.FindAsync(id);
        return palestra is null ? NotFound() : Ok(palestra);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] PalestraRequest req)
    {
        var eventoExiste = await db.Eventos.AnyAsync(e => e.Id == req.EventoId);
        if (!eventoExiste)
            return BadRequest(new { message = "Evento não encontrado." });

        var palestra = new Palestra
        {
            EventoId           = req.EventoId,
            Titulo             = req.Titulo,
            Descricao          = req.Descricao,
            Palestrante        = req.Palestrante,
            Sala               = req.Sala,
            Inicio             = req.Inicio,
            Fim                = req.Fim,
            TempoMinimoMinutos = req.TempoMinimoMinutos,
            Pontuacao          = req.Pontuacao,
        };

        db.Palestras.Add(palestra);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obter), new { id = palestra.Id }, palestra);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] PalestraRequest req)
    {
        var palestra = await db.Palestras.FindAsync(id);
        if (palestra is null) return NotFound();

        palestra.EventoId           = req.EventoId;
        palestra.Titulo             = req.Titulo;
        palestra.Descricao          = req.Descricao;
        palestra.Palestrante        = req.Palestrante;
        palestra.Sala               = req.Sala;
        palestra.Inicio             = req.Inicio;
        palestra.Fim                = req.Fim;
        palestra.TempoMinimoMinutos = req.TempoMinimoMinutos;
        palestra.Pontuacao          = req.Pontuacao;

        await db.SaveChangesAsync();
        return Ok(palestra);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        var palestra = await db.Palestras.FindAsync(id);
        if (palestra is null) return NotFound();

        db.Palestras.Remove(palestra);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
