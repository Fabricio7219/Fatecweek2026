using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FatecWeekAPI.Models;

[Table("alunos")]
public class Aluno
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("ra")]
    [StringLength(20)]
    public string Ra { get; set; } = string.Empty;

    [Required]
    [Column("nome_completo")]
    [StringLength(255)]
    public string NomeCompleto { get; set; } = string.Empty;

    [Column("curso")]
    [StringLength(100)]
    public string? Curso { get; set; }

    [Column("email")]
    [StringLength(150)]
    public string? Email { get; set; }

    [Column("foto_referencia")]
    public string? FotoReferencia { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<Checkin> Checkins { get; set; } = [];
    public ICollection<AlunoEstande> AlunoEstandes { get; set; } = [];
    public ICollection<Pontuacao> Pontuacoes { get; set; } = [];
}
