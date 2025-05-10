import DocumentIntelligence from "@azure-rest/ai-document-intelligence";

const key = process.env.FORM_RECOGNIZER_KEY!;
const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT!;

const client = DocumentIntelligence(endpoint, {
  key: key,
});

export default client;
