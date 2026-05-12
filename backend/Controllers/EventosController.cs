using FatecWeekAPI.Data;
using FatecWeekAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FatecWeekAPI.Controllers;

[ApiController]
[Route("api/eventos")]
[Authorize]
public class EventosController(AppDbContext db) : ControllerBase
{
    public record EventoRequest(
        string NomeEvento, string Tipo,
        DateOnly Data, TimeOnly HoraInicio, TimeOnly HoraFim,
        decimal Pontuacao, int TempoMinimoMinutos = 0);

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var lista = await db.Eventos
            .OrderBy(e => e.Data).ThenBy(e => e.HoraInicio)
            .Select(e => new {
                e.Id, e.NomeEvento, e.Tipo, e.Data,
                e.HoraInicio, e.HoraFim, e.Pontuacao, e.TempoMinimoMinutos, e.CreatedAt
            }).ToListAsync();
        return Ok(lista);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obter(int id)
    {
        var evento = await db.Eventos.FindAsync(id);
        return evento is null ? NotFound() : Ok(evento);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] EventoRequest req)
    {
        if (req.Tipo is not ("palestra" or "feira"))
            return BadRequest(new { message = "Tipo deve ser 'palestra' ou 'feira'." });

        var evento = new Evento
        {
            NomeEvento          = req.NomeEvento,
            Tipo                = req.Tipo,
            Data                = req.Data,
            HoraInicio          = req.HoraInicio,
            HoraFim             = req.HoraFim,
            Pontuacao           = req.Pontuacao,
            TempoMinimoMinutos  = req.TempoMinimoMinutos,
        };

        db.Eventos.Add(evento);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obter), new { id = evento.Id }, evento);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] EventoRequest req)
    {
        var evento = await db.Eventos.FindAsync(id);
        if (evento is null) return NotFound();

        if (req.Tipo is not ("palestra" or "feira"))
            return BadRequest(new { message = "Tipo deve ser 'palestra' ou 'feira'." });

        evento.NomeEvento         = req.NomeEvento;
        evento.Tipo                = req.Tipo;
        evento.Data                = req.Data;
        evento.HoraInicio          = req.HoraInicio;
        evento.HoraFim             = req.HoraFim;
        evento.Pontuacao           = req.Pontuacao;
        evento.TempoMinimoMinutos  = req.TempoMinimoMinutos;

        await db.SaveChangesAsync();
        return Ok(evento);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        var evento = await db.Eventos.FindAsync(id);
        if (evento is null) return NotFound();

        db.Eventos.Remove(evento);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
