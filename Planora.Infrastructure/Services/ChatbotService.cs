using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Planora.Application.Interfaces;

namespace Planora.Infrastructure.Services;

public class ChatbotService : IChatbotService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public ChatbotService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> GetResponseAsync(string message, string? context = null)
    {
        var apiKey = _configuration["OpenAI:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
            return "Chatbot is not configured. Please set the OpenAI API key.";

        var systemMessage = "You are a helpful project management assistant for Planora. " +
                           "Help users with project management tasks, sprints, and task organization.";

        if (!string.IsNullOrEmpty(context))
            systemMessage += $" Context: {context}";

        var requestBody = new
        {
            model = "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = systemMessage },
                new { role = "user", content = message }
            },
            max_tokens = 500
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        request.Content = content;
        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
            return "Unable to get a response from the AI assistant at this time.";

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString()
               ?? "No response received.";
    }
}
