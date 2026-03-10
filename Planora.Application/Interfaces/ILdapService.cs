namespace Planora.Application.Interfaces;

public interface ILdapService
{
    Task<bool> AuthenticateAsync(string email, string password);

    Task CreateUserAsync(
        string username, 
        string password, 
        string firstName, 
        string lastName, 
        string email);
}