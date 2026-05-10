using Microsoft.EntityFrameworkCore;
using FatecWeekAPI.Models;

namespace FatecWeekAPI.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Aluno> Alunos => Set<Aluno>();
    public DbSet<Evento> Eventos => Set<Evento>();
    public DbSet<Estande> Estandes => Set<Estande>();
    public DbSet<AlunoEstande> AlunoEstandes => Set<AlunoEstande>();
    public DbSet<Checkin> Checkins => Set<Checkin>();
    public DbSet<Pontuacao> Pontuacoes => Set<Pontuacao>();
    public DbSet<Palestra> Palestras => Set<Palestra>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Aluno: RA único
        modelBuilder.Entity<Aluno>()
            .HasIndex(a => a.Ra)
            .IsUnique();

        // Evento: CHECK tipo
        modelBuilder.Entity<Evento>()
            .ToTable(t => t.HasCheckConstraint("CK_eventos_tipo", "tipo IN ('palestra', 'feira')"));

        // Checkin: 1 aluno por evento (UNIQUE)
        modelBuilder.Entity<Checkin>()
            .HasIndex(c => new { c.AlunoId, c.EventoId })
            .IsUnique();

        modelBuilder.Entity<Checkin>()
            .ToTable(t => t.HasCheckConstraint("CK_checkins_tipo_participacao", "tipo_participacao IN ('visitante', 'expositor')"));

        // Usuario: email e username únicos
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.UserName)
            .IsUnique();
    }
}
