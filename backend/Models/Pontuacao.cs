using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FatecWeekAPI.Models;

[Table("pontuacoes")]
public class Pontuacao
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("aluno_id")]
    public int AlunoId { get; set; }

    [Column("evento_id")]
    public int EventoId { get; set; }

    [Column("pontuacao_obtida", TypeName = "decimal(3,1)")]
    public decimal PontuacaoObtida { get; set; }

    [ForeignKey(nameof(AlunoId))]
    public Aluno Aluno { get; set; } = null!;

    [ForeignKey(nameof(EventoId))]
    public Evento Evento { get; set; } = null!;
}
