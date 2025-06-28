const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const PORT = 3009;

app.use(express.static('public1'));
app.use(express.json());

app.post('/run-test', (req, res) => {
  const {
    target, method, duration, arrivalRate, endpoint, headers, body
  } = req.body;

  const config = {
    config: {
      target,
      phases: [{ duration, arrivalRate }]
    },
    scenarios: [{
      flow: [
        {
          [method.toLowerCase()]: Object.assign(
            { url: endpoint },
            headers && Object.keys(headers).length > 0 ? { headers } : {},
            body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
              ? { json: JSON.parse(body) }
              : {}
          )
        }
      ]
    }]
  };

  const yaml = require('js-yaml').dump(config);
  const filename = `temp-${Date.now()}.yml`;
  fs.writeFileSync(filename, yaml);

  exec(`artillery run ${filename}`, (error, stdout, stderr) => {
    fs.unlinkSync(filename);
    if (error) return res.status(500).json({ error: error.message });    
    res.json({ result: stdout });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Load tester listening at http://localhost:${PORT}`);
});
