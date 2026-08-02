in '/Volumes/mnt/Workspace/llm-gateway/apps/gateway-portal/components/models/model-management-client.tsx' create a button to test the whether we call the model successfully. for openAI compatible provider model, the example payload is {
"model": "{models.alias}",
"messages": [
{
"role": "system",
"content": "You are a helpful assistant. Keep answers brief."
},
{
"role": "user",
"content": "Hi there!"
}
],
"stream": false,
"metadata": {
"user_email": "user@example.com"
}
}.

For anthorpic compatible model, the example pyload is {
"model": "{models.alias}",
"messages": [
{
"role": "system",
"content": [
{
"type": "text",
"text": "You are a helpful assistant. Keep answers brief."
}
]
},
{
"role": "user",
"content": [
{
"type": "text",
"text": "Hi there!"
}
]
}
],
"metadata": {
"user_email": "user@example.com"
}
}.
Use one of decrypted chile key as `Authorization: Bearer sk_<jwt>` to the url. The PROXY URL for API calling is the env variable `NEXT_PUBLIC_PROXY_API_URL`
For OPEN AI compatible models, the URL to test is `${NEXT_PUBLIC_PROXY_API_URL}/openai/chat/completions`
For Anthropic compatible models, the URL to test is `${NEXT_PUBLIC_PROXY_API_URL}/anthropic/v1/messages`
If NEXT_PUBLIC_PROXY_API_URL is not provided, the default is http://localhost:8080

The user experience: A button to test the model if its response status code is 201 or 200.

Security: The API testing should be performed at the backend
