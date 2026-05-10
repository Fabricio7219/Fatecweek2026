using System.Text;
using FatecWeekAPI.Data;
using FatecWeekAPI.Models;
using FatecWeekAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ─── Banco de dados ───────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── JWT ─────────────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key não configurado.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<JwtService>();

// ─── CORS (permite o frontend React acessar a API) ───────────────────────────
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173", "http://localhost:3000")
         .AllowAnyHeader()
         .AllowAnyMethod()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ─── Seed: cria admin padrão se não existir ──────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db         = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config     = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var adminEmail = config["AdminEmail"] ?? "admin@fatecweek.local";
    var adminSenha = config["AdminSenha"] ?? "Admin@2026";

    db.Database.EnsureCreated();

    if (!db.Usuarios.Any(u => u.Role == "admin"))
    {
        db.Usuarios.Add(new Usuario
        {
            Nome      = "Administrador",
            Email     = adminEmail,
            UserName  = "admin",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(adminSenha),
            Role      = "admin",
        });
        db.SaveChanges();
    }
}

// ─── Pipeline ────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
