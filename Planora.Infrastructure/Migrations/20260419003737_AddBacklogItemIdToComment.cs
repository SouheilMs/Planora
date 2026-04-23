using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBacklogItemIdToComment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "TaskId",
                table: "Comments",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "BacklogItemId",
                table: "Comments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_BacklogItemId",
                table: "Comments",
                column: "BacklogItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_BacklogItems_BacklogItemId",
                table: "Comments",
                column: "BacklogItemId",
                principalTable: "BacklogItems",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_BacklogItems_BacklogItemId",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_BacklogItemId",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "BacklogItemId",
                table: "Comments");

            migrationBuilder.AlterColumn<Guid>(
                name: "TaskId",
                table: "Comments",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
