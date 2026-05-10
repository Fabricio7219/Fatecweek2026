using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FatecWeekAPI.Models;

[Table("eventos")]
public class Evento
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("nome_evento")]
    [StringLength(255)]
    public string NomeEvento { get; set; } = string.Empty;

    [Column("tipo")]
    [StringLength(50)]
    public string? Tipo { get; set; } // 'palestra' | 'feira'

    [Required]
    [Column("data")]
    public DateOnly Data { get; set; }

    [Required]
    [Column("hora_inicio")]
    public TimeOnly HoraInicio { get; set; }

    [Required]
    [Column("hora_fim")]
    public TimeOnly HoraFim { get; set; }

    [Column("pontuacao", TypeName = "decimal(3,1)")]
    public decimal Pontuacao { get; set; }

    /// <summary>Tempo mínimo em minutos que o aluno deve permanecer para receber pontos.</summary>
    [Column("tempo_minimo_minutos")]
    public int TempoMinimoMinutos { get; set; } = 0;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<Checkin> Checkins { get; set; } = [];
    public ICollection<Estande> Estandes { get; set; } = [];
    public ICollection<Pontuacao> Pontuacoes { get; set; } = [];
}
