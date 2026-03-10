namespace Planora.Application.Interfaces;

public interface ILdapService
{

    Task CreateUserAsync(
        string username, 
        string password, 
        string firstName, 
        string lastName, 
        string email);
}