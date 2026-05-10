using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FatecWeekAPI.Models;

[Table("usuarios")]
public class Usuario
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("nome")]
    [StringLength(255)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [Column("email")]
    [StringLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Column("user_name")]
    [StringLength(100)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [Column("senha_hash")]
    public string SenhaHash { get; set; } = string.Empty;

    [Column("cpf")]
    [StringLength(14)]
    public string? Cpf { get; set; }

    // 'admin' | 'mesario'
    [Column("role")]
    [StringLength(20)]
    public string Role { get; set; } = "mesario";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
