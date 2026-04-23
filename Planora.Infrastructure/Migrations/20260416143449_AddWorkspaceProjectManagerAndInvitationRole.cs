using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceProjectManagerAndInvitationRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "WorkspaceInvitations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "WorkspaceInvitations");

            migrationBuilder.AddColumn<string>(
                name: "ProjectManagerId",
                table: "Workspaces",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "WorkspaceInvitations",
                type: "nvarchar(max)",
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
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropColumn(
                name: "Role",
                table: "WorkspaceInvitations");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Workspaces",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "WorkspaceInvitations",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "WorkspaceInvitations",
                type: "datetime2",
                nullable: true);
        }
    }
}
