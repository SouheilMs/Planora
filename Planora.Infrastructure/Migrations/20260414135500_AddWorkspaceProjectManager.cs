using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Planora.Infrastructure.Data;

#nullable disable

namespace Planora.Infrastructure.Migrations
{
  [DbContext(typeof(ApplicationDbContext))]
  [Migration("20260414135500_AddWorkspaceProjectManager")]
  public partial class AddWorkspaceProjectManager : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<string>(
          name: "ProjectManagerId",
          table: "Workspaces",
          type: "nvarchar(450)",
          nullable: true);

      migrationBuilder.Sql(@"
UPDATE w
SET ProjectManagerId = OwnerId
FROM Workspaces w
WHERE ProjectManagerId IS NULL OR ProjectManagerId = ''");

      migrationBuilder.AlterColumn<string>(
          name: "ProjectManagerId",
          table: "Workspaces",
          type: "nvarchar(450)",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "nvarchar(450)",
          oldNullable: true);

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
    }
  }
}