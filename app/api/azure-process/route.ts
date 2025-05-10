import client from "@/lib/client";
import {
  getLongRunningPoller,
  isUnexpected,
} from "@azure-rest/ai-document-intelligence";

import type { AnalyzeOperationOutput } from "@azure-rest/ai-document-intelligence";

// Interface for the commission data with bounding box
interface CommissionData {
  id: string;
  commission: string;
  coordinates: number[]; // Flat array format: [x1,y1,x2,y2,x3,y3,x4,y4]
}

// Interface for the API response
interface AzureProcessResponse {
  commissionData: CommissionData[];
  width: number;
  height: number;
  pageWidthInches: number;
  pageHeightInches: number;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return new Response(JSON.stringify({ error: "No file uploaded" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Read file as ArrayBuffer and convert to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log("PDF Buffer:", buffer);

  // Convert buffer to base64
  const base64Source = buffer.toString("base64");

  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "second")
    .post({
      contentType: "application/json",
      body: {
        base64Source,
      },
      queryParameters: { locale: "en-IN" },
    });

  if (isUnexpected(initialResponse)) {
    throw initialResponse.body.error;
  }

  const poller = getLongRunningPoller(client, initialResponse);
  const analyzeResult = (
    (await poller.pollUntilDone()).body as AnalyzeOperationOutput
  ).analyzeResult;
  console.log(analyzeResult);

  // Extract only commission and bounding boxes
  const commissionData: CommissionData[] = analyzeResult?.documents
    ?.filter(doc => doc.fields?.commission)
    .map((doc, index) => {
      // Get commission field
      const commission = doc.fields?.commission?.content || '';
      
      // Get bounding box for the commission field
      // Convert polygon to the format expected by PDFViewer
      const polygon = doc.fields?.commission?.boundingRegions?.[0]?.polygon || [];
      
      return {
        id: `commission-${index}`,
        commission,
        coordinates: polygon, // Flat array format: [x1,y1,x2,y2,x3,y3,x4,y4]
      };
    }) || [];

  // Get page dimensions with fallbacks to default values
  const width = analyzeResult?.pages?.[0]?.width || 612; // Default to 8.5 inches in points
  const height = analyzeResult?.pages?.[0]?.height || 792; // Default to 11 inches in points
  
  // Create typed response object
  const response: AzureProcessResponse = {
    commissionData,
    width,
    height,
    // Add computed page dimensions in inches for PDFViewer
    pageWidthInches: width / 72, // Converting points to inches (72 points = 1 inch)
    pageHeightInches: height / 72,
  };

  // Return only commission and bounding box data along with page dimensions
  return Response.json(response, { status: 200 });
}
