const { plainToInstance } = require('class-transformer');
const { validateSync } = require('class-validator');
const { CreateOfferDto } = require('./dist/stellar/dto/create-offer.dto');

const dto = plainToInstance(CreateOfferDto, { guaranteeId: 2, amount: 100, pricePerToken: 10 });
try {
  const errors = validateSync(dto);
  console.log("Validation output:", errors);
} catch (e) {
  console.log("Validation crash:", e.stack);
}
