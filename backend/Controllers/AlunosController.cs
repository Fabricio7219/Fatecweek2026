using FatecWeekAPI.Data;
using FatecWeekAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FatecWeekAPI.Controllers;

[ApiController]
[Route("api/alunos")]
[Authorize]
public class AlunosController(AppDbContext db) : ControllerBase
{
    public record AlunoRequest(
        string Ra, string NomeCompleto,
        string? Curso, string? Semestre, string? Turno,
        string? Email, string? FotoReferencia);

    public record CheckinInfoRequest(string? Semestre, string? Turno);

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? ra)
    {
        var query = db.Alunos.AsQueryable();
        if (!string.IsNullOrEmpty(ra))
            query = query.Where(a => a.Ra == ra);

        var lista = await query
            .Select(a => new { a.Id, a.Ra, a.NomeCompleto, a.Curso, a.Semestre, a.Turno, a.Email, a.CreatedAt })
            .ToListAsync();
        return Ok(lista);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obter(int id)
    {
        var aluno = await db.Alunos.FindAsync(id);
        return aluno is null ? NotFound() : Ok(aluno);
    }

    // Busca por RA — usado pelo mesário no check-in manual
    [HttpGet("por-ra/{ra}")]
    public async Task<IActionResult> ObterPorRa(string ra)
    {
        var aluno = await db.Alunos.FirstOrDefaultAsync(a => a.Ra == ra);
        return aluno is null ? NotFound() : Ok(aluno);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] AlunoRequest req)
    {
        if (await db.Alunos.AnyAsync(a => a.Ra == req.Ra))
            return Conflict(new { message = "RA já cadastrado." });

        var aluno = new Aluno
        {
            Ra             = req.Ra,
            NomeCompleto   = req.NomeCompleto,
            Curso          = req.Curso,
            Semestre       = req.Semestre,
            Turno          = req.Turno,
            Email          = req.Email,
            FotoReferencia = req.FotoReferencia,
        };

        db.Alunos.Add(aluno);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obter), new { id = aluno.Id }, aluno);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] AlunoRequest req)
    {
        var aluno = await db.Alunos.FindAsync(id);
        if (aluno is null) return NotFound();

        aluno.NomeCompleto   = req.NomeCompleto;
        aluno.Curso          = req.Curso;
        aluno.Semestre       = req.Semestre;
        aluno.Turno          = req.Turno;
        aluno.Email          = req.Email;
        aluno.FotoReferencia = req.FotoReferencia;

        await db.SaveChangesAsync();
        return Ok(aluno);
    }

    // PATCH /api/alunos/{id}/checkin-info — atualiza semestre e turno durante o check-in
    [HttpPatch("{id}/checkin-info")]
    public async Task<IActionResult> AtualizarCheckinInfo(int id, [FromBody] CheckinInfoRequest req)
    {
        var aluno = await db.Alunos.FindAsync(id);
        if (aluno is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Semestre)) aluno.Semestre = req.Semestre;
        if (!string.IsNullOrWhiteSpace(req.Turno))    aluno.Turno    = req.Turno;

        await db.SaveChangesAsync();
        return Ok(new { aluno.Id, aluno.Ra, aluno.Semestre, aluno.Turno });
    }
}
