(() => {
  const form = document.querySelector('[data-billing-cost-form]');
  if (!form) return;

  const insuranceInput = form.querySelector('#insurance-collections');
  const patientInput = form.querySelector('#patient-collections');
  const status = form.querySelector('#calculator-status');
  const resetButton = form.querySelector('[data-calculator-reset]');
  const presets = [...form.querySelectorAll('[data-insurance-collections][data-patient-collections]')];
  const outputs = {
    total: form.querySelector('#calculated-total-collections'),
    monthlyFee: form.querySelector('#calculated-monthly-fee'),
    annualFee: form.querySelector('#calculated-annual-fee'),
    remaining: form.querySelector('#calculated-remaining-collections')
  };
  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function setOutput(output, value) {
    const formatted = money.format(value);
    output.value = formatted;
    output.textContent = formatted;
  }

  function resetOutputs() {
    Object.values(outputs).forEach((output) => setOutput(output, 0));
  }

  function readAmount(input) {
    const raw = input.value.trim();
    if (!raw) return { valid: true, value: 0 };
    const value = Number(raw);
    const valid = input.validity.valid && Number.isFinite(value) && value >= 0;
    return { valid, value: valid ? value : 0 };
  }

  function render({ focusOutput = false } = {}) {
    const insurance = readAmount(insuranceInput);
    const patient = readAmount(patientInput);
    insuranceInput.setAttribute('aria-invalid', String(!insurance.valid));
    patientInput.setAttribute('aria-invalid', String(!patient.valid));

    if (!insurance.valid || !patient.valid) {
      resetOutputs();
      status.classList.add('calculator-status--error');
      status.textContent = 'Enter zero or a positive dollar amount with no more than two decimal places.';
      return false;
    }

    const total = insurance.value + patient.value;
    const monthlyFee = total * 0.05;
    const annualFee = monthlyFee * 12;
    const remaining = total - monthlyFee;
    if (![total, monthlyFee, annualFee, remaining].every(Number.isFinite)) {
      resetOutputs();
      status.classList.add('calculator-status--error');
      status.textContent = 'The entered amount is too large to calculate. Enter a smaller dollar amount.';
      return false;
    }

    setOutput(outputs.total, total);
    setOutput(outputs.monthlyFee, monthlyFee);
    setOutput(outputs.annualFee, annualFee);
    setOutput(outputs.remaining, remaining);
    status.classList.remove('calculator-status--error');
    status.textContent = `Estimate updated. The monthly 5% fee is ${money.format(monthlyFee)}.`;
    if (focusOutput) outputs.monthlyFee.focus();
    return true;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render({ focusOutput: true });
  });

  [insuranceInput, patientInput].forEach((input) => {
    input.addEventListener('input', () => render());
  });

  presets.forEach((preset) => {
    preset.addEventListener('click', () => {
      insuranceInput.value = preset.dataset.insuranceCollections || '';
      patientInput.value = preset.dataset.patientCollections || '';
      render({ focusOutput: true });
    });
  });

  resetButton.addEventListener('click', () => {
    insuranceInput.value = '';
    patientInput.value = '';
    insuranceInput.setAttribute('aria-invalid', 'false');
    patientInput.setAttribute('aria-invalid', 'false');
    resetOutputs();
    status.classList.remove('calculator-status--error');
    status.textContent = 'Calculator reset.';
    insuranceInput.focus();
  });

  render();
})();
