using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planora.Infrastructure.Migrations
{
    public partial class AddSubTaskFix : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // BranchId already exists in BacklogCommits from a previous migration.
            // Nothing to do.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nothing to undo.
        }
    }
}