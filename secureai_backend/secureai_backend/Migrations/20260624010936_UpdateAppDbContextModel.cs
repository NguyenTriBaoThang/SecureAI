using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace secureai_backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAppDbContextModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RuleConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BlockThreshold = table.Column<double>(type: "float", nullable: false),
                    ReviewThreshold = table.Column<double>(type: "float", nullable: false),
                    AutoBlockEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AutoAlertEnabled = table.Column<bool>(type: "bit", nullable: false),
                    BlockMaliciousLabels = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RuleConfigurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RuleConfigurations_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "RuleConfigurations",
                columns: new[] { "Id", "AutoAlertEnabled", "AutoBlockEnabled", "BlockMaliciousLabels", "BlockThreshold", "ReviewThreshold", "UpdatedAt", "UpdatedByUserId" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), true, true, true, 0.84999999999999998, 0.45000000000000001, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null });

            migrationBuilder.CreateIndex(
                name: "IX_RuleConfigurations_UpdatedByUserId",
                table: "RuleConfigurations",
                column: "UpdatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RuleConfigurations");
        }
    }
}
