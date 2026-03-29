using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusToBacklogItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "BacklogItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_BacklogItems_SprintId",
                table: "BacklogItems",
                column: "SprintId");

            migrationBuilder.AddForeignKey(
                name: "FK_BacklogItems_Sprints_SprintId",
                table: "BacklogItems",
                column: "SprintId",
                principalTable: "Sprints",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BacklogItems_Sprints_SprintId",
                table: "BacklogItems");

            migrationBuilder.DropIndex(
                name: "IX_BacklogItems_SprintId",
                table: "BacklogItems");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "BacklogItems");
        }
    }
}
