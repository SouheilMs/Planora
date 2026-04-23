using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveProjectManagerIdFromWorkspace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workspaces_AspNetUsers_ProjectManagerId",
                table: "Workspaces");

            migrationBuilder.DropIndex(
                name: "IX_Workspaces_ProjectManagerId",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "ProjectManagerId",
                table: "Workspaces");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProjectManagerId",
                table: "Workspaces",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Workspaces_ProjectManagerId",
                table: "Workspaces",
                column: "ProjectManagerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Workspaces_AspNetUsers_ProjectManagerId",
                table: "Workspaces",
                column: "ProjectManagerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
