using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace secureai_backend.Migrations
{
    /// <inheritdoc />
    public partial class ChildSafeNetPort : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ModelRegistries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Accuracy = table.Column<double>(type: "float", nullable: true),
                    F1Weighted = table.Column<double>(type: "float", nullable: true),
                    MetricsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelRegistries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ScanLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    Label = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    RiskLevel = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Score = table.Column<double>(type: "float", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    ExplanationJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScanLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScanLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UrlDatasets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    Host = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    PredictedLabel = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    PredictedScore = table.Column<double>(type: "float", nullable: false),
                    FinalLabel = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Source = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    FirstSeenAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastSeenAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SeenCount = table.Column<int>(type: "int", nullable: false),
                    VerifiedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UrlDatasets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UrlDatasets_Users_VerifiedByUserId",
                        column: x => x.VerifiedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "UrlFeedbacks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    FeedbackLabel = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UrlFeedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UrlFeedbacks_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSettings",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChildAge = table.Column<int>(type: "int", nullable: false),
                    Mode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    WhitelistJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BlacklistJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BlockAdult = table.Column<bool>(type: "bit", nullable: false),
                    BlockGambling = table.Column<bool>(type: "bit", nullable: false),
                    BlockPhishing = table.Column<bool>(type: "bit", nullable: false),
                    WarnSuspicious = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSettings", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModelRegistries_CreatedAt",
                table: "ModelRegistries",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ScanLogs_Action",
                table: "ScanLogs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_ScanLogs_CreatedAt",
                table: "ScanLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ScanLogs_Label",
                table: "ScanLogs",
                column: "Label");

            migrationBuilder.CreateIndex(
                name: "IX_ScanLogs_UserId",
                table: "ScanLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UrlDatasets_LastSeenAt",
                table: "UrlDatasets",
                column: "LastSeenAt");

            migrationBuilder.CreateIndex(
                name: "IX_UrlDatasets_Status",
                table: "UrlDatasets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_UrlDatasets_Url",
                table: "UrlDatasets",
                column: "Url",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UrlDatasets_VerifiedByUserId",
                table: "UrlDatasets",
                column: "VerifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UrlFeedbacks_CreatedAt",
                table: "UrlFeedbacks",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UrlFeedbacks_UserId",
                table: "UrlFeedbacks",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModelRegistries");

            migrationBuilder.DropTable(
                name: "ScanLogs");

            migrationBuilder.DropTable(
                name: "UrlDatasets");

            migrationBuilder.DropTable(
                name: "UrlFeedbacks");

            migrationBuilder.DropTable(
                name: "UserSettings");
        }
    }
}
