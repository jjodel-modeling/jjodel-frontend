// Cloudflare Worker - Notion Notifications Proxy
// Deploy su Cloudflare Workers: https://workers.cloudflare.com

const NOTION_API_VERSION = '2022-06-28';
const DATABASE_ID = '2eb4b66bdb50802fa2cfdcdd7aae3fbf';

// Il token va nelle Environment Variables di Cloudflare, NON qui!
// Settings → Variables → Add: NOTION_TOKEN = ntn_xxx...

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      // Fetch from Notion API
      const notionResponse = await fetch(
        `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.NOTION_TOKEN}`,
            'Notion-Version': NOTION_API_VERSION,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filter: {
              property: 'Active',
              checkbox: {
                equals: true,
              },
            },
            sorts: [
              {
                property: 'Created',
                direction: 'descending',
              },
            ],
          }),
        }
      );

      if (!notionResponse.ok) {
        const error = await notionResponse.text();
        console.error('Notion API error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch from Notion' }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      const notionData = await notionResponse.json();

      // Map Notion response to our format
      const notifications = notionData.results.map((page) => {
        const props = page.properties;
        
        return {
          id: page.id,
          category: props.Category?.select?.name || 'tip',
          title: props.Title?.title?.[0]?.plain_text || '',
          message: props.Message?.rich_text?.[0]?.plain_text || props.Title?.title?.[0]?.plain_text || '',
          priority: props.Priority?.select?.name || 'info',
          date: page.created_time,
        };
      });

      return new Response(JSON.stringify({ posts: notifications }), {
        status: 200,
        headers: corsHeaders,
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
