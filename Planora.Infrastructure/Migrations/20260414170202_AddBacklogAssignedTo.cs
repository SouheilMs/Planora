using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBacklogAssignedTo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignedToId",
                table: "BacklogItems",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BacklogItems_AssignedToId",
                table: "BacklogItems",
                column: "AssignedToId");

            migrationBuilder.AddForeignKey(
                name: "FK_BacklogItems_AspNetUsers_AssignedToId",
                table: "BacklogItems",
                column: "AssignedToId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BacklogItems_AspNetUsers_AssignedToId",
                table: "BacklogItems");

            migrationBuilder.DropIndex(
                name: "IX_BacklogItems_AssignedToId",
                table: "BacklogItems");

            migrationBuilder.DropColumn(
                name: "AssignedToId",
                table: "BacklogItems");
        }
    }
}
