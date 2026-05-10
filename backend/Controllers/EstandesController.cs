using FatecWeekAPI.Data;
using FatecWeekAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FatecWeekAPI.Controllers;

[ApiController]
[Route("api/estandes")]
[Authorize]
public class EstandesController(AppDbContext db) : ControllerBase
{
    public record EstandeRequest(
        string NomeEstande, string? Tema,
        string? Descricao, string? Localizacao, int EventoId);

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int? eventoId)
    {
        var query = db.Estandes.Include(e => e.Evento).AsQueryable();
        if (eventoId.HasValue)
            query = query.Where(e => e.EventoId == eventoId.Value);

        var lista = await query
            .Select(e => new {
                e.Id, e.NomeEstande, e.Tema, e.Descricao,
                e.Localizacao, e.EventoId,
                NomeEvento = e.Evento.NomeEvento
            }).ToListAsync();
        return Ok(lista);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obter(int id)
    {
        var estande = await db.Estandes.Include(e => e.Evento).FirstOrDefaultAsync(e => e.Id == id);
        return estande is null ? NotFound() : Ok(estande);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] EstandeRequest req)
    {
        if (!await db.Eventos.AnyAsync(e => e.Id == req.EventoId))
            return BadRequest(new { message = "Evento não encontrado." });

        var estande = new Estande
        {
            NomeEstande = req.NomeEstande,
            Tema        = req.Tema,
            Descricao   = req.Descricao,
            Localizacao = req.Localizacao,
            EventoId    = req.EventoId,
        };

        db.Estandes.Add(estande);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obter), new { id = estande.Id }, estande);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] EstandeRequest req)
    {
        var estande = await db.Estandes.FindAsync(id);
        if (estande is null) return NotFound();

        estande.NomeEstande = req.NomeEstande;
        estande.Tema        = req.Tema;
        estande.Descricao   = req.Descricao;
        estande.Localizacao = req.Localizacao;
        estande.EventoId    = req.EventoId;

        await db.SaveChangesAsync();
        return Ok(estande);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        var estande = await db.Estandes.FindAsync(id);
        if (estande is null) return NotFound();

        db.Estandes.Remove(estande);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
