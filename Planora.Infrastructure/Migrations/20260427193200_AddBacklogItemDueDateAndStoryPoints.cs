using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planora.Infrastructure.Migrations
{
  /// <inheritdoc />
  public partial class AddBacklogItemDueDateAndStoryPoints : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.BacklogItems', 'DueDate') IS NULL
BEGIN
    ALTER TABLE [dbo].[BacklogItems] ADD [DueDate] datetime2 NULL;
END;

IF COL_LENGTH('dbo.BacklogItems', 'StoryPoints') IS NULL
BEGIN
    ALTER TABLE [dbo].[BacklogItems] ADD [StoryPoints] int NULL;
END;
");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.BacklogItems', 'StoryPoints') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[BacklogItems] DROP COLUMN [StoryPoints];
END;

IF COL_LENGTH('dbo.BacklogItems', 'DueDate') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[BacklogItems] DROP COLUMN [DueDate];
END;
");
    }
  }
}