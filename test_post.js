fetch("http://localhost:3000/marketplace/offer", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ guaranteeId: 2, amount: 100, pricePerToken: 10 })
}).then(res => res.json()).then(console.log).catch(console.error);
