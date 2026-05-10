using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FatecWeekAPI.Models;

[Table("checkins")]
public class Checkin
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("aluno_id")]
    public int AlunoId { get; set; }

    [Column("evento_id")]
    public int EventoId { get; set; }

    [Column("horario_entrada")]
    public DateTime? HorarioEntrada { get; set; }

    [Column("horario_saida")]
    public DateTime? HorarioSaida { get; set; }

    [Column("latitude", TypeName = "decimal(9,6)")]
    public decimal? Latitude { get; set; }

    [Column("longitude", TypeName = "decimal(9,6)")]
    public decimal? Longitude { get; set; }

    [Column("face_validado")]
    public bool FaceValidado { get; set; }

    [Column("foto_checkin")]
    public string? FotoCheckin { get; set; }

    [Column("tipo_participacao")]
    [StringLength(20)]
    public string? TipoParticipacao { get; set; } // 'visitante' | 'expositor'

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [ForeignKey(nameof(AlunoId))]
    public Aluno Aluno { get; set; } = null!;

    [ForeignKey(nameof(EventoId))]
    public Evento Evento { get; set; } = null!;
}
