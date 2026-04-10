/* ================= GLOBAL ================= */
let billItems = [];

/* ================= SELLING PRICE ================= */
function recalcSellingPrice() {
    const opt = $('#bill_mrp option:selected');
    if (!opt.val()) return;

    const mrp = parseFloat(opt.data('mrp')) || 0;
//    const defaultDisc = parseFloat($('#bill_default_disc').val()) || 0;
    const msp = parseFloat(opt.data('msp')) || 0;

    const manualDisc = $('#bill_manual_disc_check').is(':checked')
        ? parseFloat($('#bill_manual_disc').val()) || 0
        : 0;
    let price = Math.floor(mrp / 10) * 10 - manualDisc;
//    let price = mrp - (mrp * defaultDisc / 100)
    if (price < 0) price = 0;

    $('#bill_selling_price').val(price.toFixed(0));
    $('#msp_value').text(msp.toFixed(0));

    if (msp > 0 && price < msp) {
        $('#msp_warning').show();
        $('#submit_bill_btn').prop('disabled', true);
    } else {
        $('#msp_warning').hide();
        $('#submit_bill_btn').prop('disabled', false);
    }
}

/* ================= TOTALS ================= */
function updateTotals() {
    let qty = 0, sub = 0, gst = 0;

    billItems.forEach(i => {
        qty += i.qty;
        sub += i.final;
        gst += i.gst_amount;
    });

    $('#totalQty').val(qty);
    $('#subtotal').val(sub.toFixed(0));
    $('#totalGst').val(gst.toFixed(0));
    $('#cgstSplit').text((gst / 2).toFixed(0));
    $('#sgstSplit').text((gst / 2).toFixed(0));
    updatePaymentSummary();

    refreshUPIQR();
}

function updatePaymentSummary() {
    const totalPayment = parseFloat($('#subtotal').val() || 0);
    const mode = $("input[name='payment_type']:checked").val();
    const paymentReceived = mode === 'CREDIT' ? 0 : totalPayment;
    const balanceDue = totalPayment - paymentReceived;

    $('#totalPayment').val(totalPayment.toFixed(0));
    $('#paymentReceived').val(paymentReceived.toFixed(0));
    $('#balanceDue').val(balanceDue.toFixed(0));
}

function validateCreditCustomerDetails() {
    const mode = $("input[name='payment_type']:checked").val();
    const mobile = $('#customer_mobile').val().trim();
    const name = $('#customer_name').val().trim();

    if (mode === 'CREDIT' && (!mobile || !name)) {
        alert('Customer name and mobile are mandatory for credit billing.');
        return false;
    }

    return true;
}

function syncCustomerRequirement() {
    const isCredit = $("input[name='payment_type']:checked").val() === 'CREDIT';
    $('#customer_mobile, #customer_name').prop('required', isCredit);
}

/* ================= TABLE ================= */
function refreshBillTable() {
    const tbody = $('#bill_items_table tbody').empty();

    billItems.forEach((i, idx) => {
        tbody.append(`
            <tr>
                <td>${i.brand}</td>
                <td>${i.category}</td>
                <td>${i.section}</td>
                <td>${i.size}</td>
                <td>${i.color}</td>
                <td>${i.qty}</td>
                <td>${i.mrp}</td>
                <td>${i.price}</td>
                <td>${i.discount.toFixed(0)}%</td>
                <td>${i.gst_percent}%</td>
                <td>${i.final.toFixed(0)}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-danger"
                            onclick="removeItem(${idx})">X</button>
                </td>
            </tr>
        `);
    });

    $('#items_json').val(JSON.stringify(billItems));
    updateTotals();
}

function removeItem(i) {
    billItems.splice(i, 1);
    refreshBillTable();
}

/* ================= EVENTS ================= */
$(function () {

    // ================= ENABLE SEARCH =================
    $('#bill_brand, #bill_category, #bill_section, #bill_size, #bill_color, #bill_mrp').select2({
        width: '100%',
        placeholder: "Search...",
        allowClear: true
    });

    $('#bill_manual_disc').on('input', recalcSellingPrice);

    $('#bill_manual_disc_check').on('change', function () {
        $('#bill_manual_disc_container').toggle(this.checked);
        recalcSellingPrice();
    });

    syncCustomerRequirement();
    updatePaymentSummary();

    $(document).on('change', '#bill_mrp', function () {
        const opt = $(this).find(':selected');
        $('#bill_default_disc').val(opt.data('defaultDisc') || 0);
        recalcSellingPrice();
    });

    $('#btn_add_to_bill').on('click', function () {

        const opt = $('#bill_mrp option:selected');
        if (!opt.val()) return alert('Select MRP');

        const qty = parseInt($('#bill_qty').val()) || 0;
        if (qty <= 0) return alert('Invalid quantity');

        const mrp = parseFloat(opt.data('mrp'));
        const gst = parseFloat(opt.data('gst')) || 0;
        const price = parseFloat($('#bill_selling_price').val());

        const total = price * qty;
        const base = total * 100 / (100 + gst);

        billItems.push({
            purchase_item_id: opt.val(),
            brand: $('#bill_brand option:selected').text(),
            category: $('#bill_category option:selected').text(),
            section: $('#bill_section option:selected').text(),
            size: $('#bill_size option:selected').text(),
            color: $('#bill_color option:selected').text(),
            qty,
            mrp,
            price,
            discount: (1 - price / mrp) * 100,
            gst_percent: gst,
            gst_amount: total - base,
            final: total
        });

        refreshBillTable();
    });

    $('#billing_form').on('submit', function (e) {
        if (!billItems.length) {
            e.preventDefault();
            alert('Add at least one item to the bill.');
            return;
        }

        if (!validateCreditCustomerDetails()) {
            e.preventDefault();
        }
    });
});

/* ================= SIZE → COLOR ================= */
$(document).on('change', '#bill_size', function () {

    $('#bill_color').html('<option value="">Select Color</option>').trigger('change.select2');
    $('#bill_mrp').html('<option value="" disabled selected>Select MRP</option>').trigger('change.select2');
    $('#bill_stock_qty').text('0');

    $.get('/ajax/get-colors/', {
        brand: $('#bill_brand').val(),
        category: $('#bill_category').val(),
        section: $('#bill_section').val(),
        size: $(this).val()
    }, function (res) {
        res.colors.forEach(c => {
            $('#bill_color').append(`<option value="${c.id}">${c.name}</option>`);
        });

        $('#bill_color').trigger('change.select2');   // ✅ FIXED
    });
});

/* ================= COLOR → MRP ================= */
$(document).on('change', '#bill_color', function () {

    const $mrp = $('#bill_mrp');
    $mrp.html('<option value="" disabled selected>Select MRP</option>').trigger('change.select2');
    $('#bill_stock_qty').text('0');

    $.get('/ajax/get-product-id/', {
        brand: $('#bill_brand').val(),
        category: $('#bill_category').val(),
        section: $('#bill_section').val(),
        size: $('#bill_size').val(),
        color: $(this).val()
    }, function (res) {

        if (!res.product_id) return;

        $.get('/ajax/product-mrps/', { product_id: res.product_id }, function (resp) {

            let totalStock = 0;
            resp.results.forEach(p => {
                totalStock += p.stock;
                $mrp.append(`
                    <option value="${p.purchase_item_id}"
                            data-mrp="${p.mrp}"
                            data-gst="${p.gst}"
                            data-default-disc="${p.default_disc}"
                            data-msp="${p.msp}">
                        ₹ ${p.mrp} (Stock: ${p.stock})
                    </option>
                `);
            });

            $('#bill_stock_qty').text(totalStock);
            $('#bill_mrp').trigger('change.select2');   // ✅ FIXED
        });
    });
});

/* ================= CUSTOMER AUTO FILL ================= */
$('#customer_mobile').on('blur', function () {

    const mobile = $(this).val().trim();
    if (!/^[6-9]\d{9}$/.test(mobile)) return;

    $.get('/ajax/get-customer/', { mobile }, function (res) {
        if (res.found) {
            $('#customer_name').val(res.name);
        }
    });
});

/* ================= UPI QR ================= */
const UPI_ID = "8260323662-2@ybl";
const UPI_NAME = "AONE FOOTWEAR";

function refreshUPIQR() {
    const mode = $("input[name='payment_type']:checked").val();
    const amount = parseFloat($('#subtotal').val() || 0);

    if (mode !== 'UPI' || amount <= 0) {
        $('#upi_qr_section').hide();
        return;
    }

    const url = `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${amount.toFixed(2)}&cu=INR`;
    QRCode.toCanvas(document.getElementById('upi_qr_canvas'), url, { width: 220 });
    $('#upi_amount').text(amount.toFixed(0));
    $('#upi_qr_section').show();
}

$(document).on('change', "input[name='payment_type']", function () {
    syncCustomerRequirement();
    updatePaymentSummary();
    refreshUPIQR();
});
