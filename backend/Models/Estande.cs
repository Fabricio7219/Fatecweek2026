using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FatecWeekAPI.Models;

[Table("estandes")]
public class Estande
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("nome_estande")]
    [StringLength(150)]
    public string NomeEstande { get; set; } = string.Empty;

    [Column("tema")]
    [StringLength(255)]
    public string? Tema { get; set; }

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Column("localizacao")]
    [StringLength(100)]
    public string? Localizacao { get; set; }

    [Column("evento_id")]
    public int EventoId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [ForeignKey(nameof(EventoId))]
    public Evento Evento { get; set; } = null!;

    public ICollection<AlunoEstande> AlunoEstandes { get; set; } = [];
}
