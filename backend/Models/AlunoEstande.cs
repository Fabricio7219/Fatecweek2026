using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FatecWeekAPI.Models;

[Table("aluno_estande")]
public class AlunoEstande
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("aluno_id")]
    public int AlunoId { get; set; }

    [Column("estande_id")]
    public int EstandeId { get; set; }

    [ForeignKey(nameof(AlunoId))]
    public Aluno Aluno { get; set; } = null!;

    [ForeignKey(nameof(EstandeId))]
    public Estande Estande { get; set; } = null!;
}
