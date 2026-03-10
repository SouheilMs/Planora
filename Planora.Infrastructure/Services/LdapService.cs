using System.DirectoryServices.Protocols;
using System.Net;
using Planora.Application.Interfaces;

namespace Planora.Infrastructure.Services;

public class LdapService : ILdapService
{
    public async Task<bool> AuthenticateAsync(string email, string password)
    {
        try
        {
            var identifier = new LdapDirectoryIdentifier("localhost", 389);
            using var connection = new LdapConnection(identifier);
            
            connection.SessionOptions.ProtocolVersion = 3;
            connection.AuthType = AuthType.Basic;

            // Corrected to .com to match your Docker environment
            var userDn = $"uid={email},ou=users,dc=test,dc=com";
            
            // In this library, a successful Bind means authentication passed
            connection.Bind(new NetworkCredential(userDn, password));
            return await Task.FromResult(true);
        }
        catch
        {
            return await Task.FromResult(false);
        }
    }

    public async Task CreateUserAsync(
        string username,
        string password,
        string firstName,
        string lastName,
        string email)
    {
        var identifier = new LdapDirectoryIdentifier("localhost", 389);
        using var connection = new LdapConnection(identifier);

        connection.SessionOptions.ProtocolVersion = 3;
        connection.AuthType = AuthType.Basic;
        
        // Corrected admin DN
        connection.Bind(new NetworkCredential("cn=admin,dc=test,dc=com", "admin"));

        var dn = $"uid={email},ou=users,dc=test,dc=com";

        var request = new AddRequest(
            dn,
            new DirectoryAttribute("objectClass", "top", "person", "organizationalPerson", "inetOrgPerson"),
            new DirectoryAttribute("uid", email),
            new DirectoryAttribute("sn", lastName),
            new DirectoryAttribute("cn", $"{firstName} {lastName}"),
            new DirectoryAttribute("mail", email),
            new DirectoryAttribute("userPassword", password)
        );

        connection.SendRequest(request);
        await Task.CompletedTask;
    }
}