// --- START OF FILE: server/visualize.js ---
// THIS IS THE FINAL, WORKING FILE.

require('dotenv').config();
// --- THIS IS THE CRITICAL FIX ---
// The variable 'fs' is now correctly assigned the file system module.
const fs = require('fs');
const path = require('path');
const open = (...args) => import('open').then(({default: open}) => open(...args));

// We must initialize the retriever for the graph to compile correctly
const { initializeRetriever } = require('./agent_engine/retriever');
const { inboundApp, outboundApp } = require('./agent_engine/inbound_team/graph');

async function main() {
    console.log('Generating graph visualizations...');

    try {
        // The graph requires the RAG retriever to be initialized
        await initializeRetriever();

        const inboundMermaid = inboundApp.getGraph().drawMermaid();
        const outboundMermaid = outboundApp.getGraph().drawMermaid();

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Agent Optimus Graph Visualization</title>
            <style>
                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; gap: 30px; padding: 20px; background-color: #f8f9fa; }
                .graph-container { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); width: 90%; }
                h1 { text-align: center; color: #2d3748; }
                pre.mermaid { text-align: center; }
            </style>
        </head>
        <body>
            <div class="graph-container"><h1>Inbound Team ("The Qualifier")</h1><pre class="mermaid">${inboundMermaid}</pre></div>
            <div class="graph-container"><h1>Outbound Team ("The Closer")</h1><pre class="mermaid">${outboundMermaid}</pre></div>
            <script type="module">
                import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
                mermaid.initialize({ startOnLoad: true });
            </script>
        </body>
        </html>
        `;

        const outputPath = path.resolve(__dirname, 'graph_visualization.html');
        fs.writeFileSync(outputPath, htmlContent);

        console.log(`✅ Visualization successful! File created at ${outputPath}`);
        
        await open(outputPath);
        console.log('🚀 Opening visualization in your browser...');

    } catch (error) {
        console.error("❌ Failed to generate graph visualization:", error);
    }
}

main();
// --- END OF FILE ---