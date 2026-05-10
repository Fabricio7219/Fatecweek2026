using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FatecWeekAPI.Models;

[Table("palestras")]
public class Palestra
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("evento_id")]
    public int EventoId { get; set; }

    [ForeignKey(nameof(EventoId))]
    public Evento? Evento { get; set; }

    [Required]
    [Column("titulo")]
    [StringLength(255)]
    public string Titulo { get; set; } = string.Empty;

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Required]
    [Column("palestrante")]
    [StringLength(255)]
    public string Palestrante { get; set; } = string.Empty;

    [Column("sala")]
    [StringLength(100)]
    public string? Sala { get; set; }

    [Column("inicio")]
    public DateTime? Inicio { get; set; }

    [Column("fim")]
    public DateTime? Fim { get; set; }

    [Column("tempo_minimo_minutos")]
    public int TempoMinimoMinutos { get; set; } = 0;

    [Column("pontuacao", TypeName = "decimal(3,1)")]
    public decimal Pontuacao { get; set; } = 0;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
