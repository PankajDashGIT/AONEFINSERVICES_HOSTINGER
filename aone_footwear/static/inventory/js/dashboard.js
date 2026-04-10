console.log("dashboard.js loaded");

/* -------------------------------
   CATEGORY LOADING FOR SECTION
--------------------------------*/
const secBrand = document.getElementById("sec_brand");
if (secBrand) {
    secBrand.addEventListener("change", function () {
        fetch(`/api/categories/?brand_id=${this.value}`)
            .then(res => res.json())
            .then(data => {
                let box = document.getElementById("sec_category");
                box.innerHTML = `<option value="">Select Category</option>`;
                data.forEach(cat => {
                    box.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
                });
            });
    });
}

/* -------------------------------
   CATEGORY LOADING FOR SIZE
--------------------------------*/
const sizeBrand = document.getElementById("size_brand");
if (sizeBrand) {
    sizeBrand.addEventListener("change", function () {
        fetch(`/api/categories/?brand_id=${this.value}`)
            .then(res => res.json())
            .then(data => {
                size_category.innerHTML = `<option value="">Select Category</option>`;
                data.forEach(cat => {
                    size_category.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
                });
                size_section.innerHTML = `<option value="">Select Section</option>`;
            });
    });
}

/* -------------------------------
   SECTION LOADING FOR SIZE
--------------------------------*/
const sizeCategory = document.getElementById("size_category");
if (sizeCategory) {
    sizeCategory.addEventListener("change", function () {
        fetch(`/api/sections/?category_id=${this.value}`)
            .then(res => res.json())
            .then(data => {
                size_section.innerHTML = `<option value="">Select Section</option>`;
                data.forEach(sec => {
                    size_section.innerHTML += `<option value="${sec.id}">${sec.name}</option>`;
                });
            });
    });
}

/* ===============================
   COLOR MASTER JS
================================*/

/* -------------------------------
   CATEGORY LOADING FOR COLOR
--------------------------------*/
const colorBrand = document.getElementById("color_brand");
if (colorBrand) {
    colorBrand.addEventListener("change", function () {
        fetch(`/api/categories/?brand_id=${this.value}`)
            .then(res => res.json())
            .then(data => {
                color_category.innerHTML = `<option value="">Select Category</option>`;
                data.forEach(cat => {
                    color_category.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
                });
                color_section.innerHTML = `<option value="">Select Section</option>`;
            });
    });
}

/* -------------------------------
   SECTION LOADING FOR COLOR
--------------------------------*/
const colorCategory = document.getElementById("color_category");
if (colorCategory) {
    colorCategory.addEventListener("change", function () {
        fetch(`/api/sections/?category_id=${this.value}`)
            .then(res => res.json())
            .then(data => {
                color_section.innerHTML = `<option value="">Select Section</option>`;
                data.forEach(sec => {
                    color_section.innerHTML += `<option value="${sec.id}">${sec.name}</option>`;
                });
            });
    });
}

const colorSection = document.getElementById("color_section");
if (colorSection) {
    colorSection.addEventListener("change", function () {
        fetch(`/api/sizes/?section_id=${this.value}`)
            .then(res => res.json())
            .then(data => {
                color_size.innerHTML = `<option value="">Select Size</option>`;
                data.forEach(sz => {
                    color_size.innerHTML += `<option value="${sz.id}">${sz.value}</option>`;
                });
            });
    });
}

// Enable size dropdown once populated
function enableColorSize() {
    const sizeBox = document.getElementById("color_size");
    if (sizeBox) sizeBox.removeAttribute("disabled");
}