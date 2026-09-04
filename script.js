// URL pública da planilha Google Sheets (pub?output=csv)
const SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSMcxBOZb0MNVidxXxe2LIzWwI9MNG3OyRexIBMitroPKb2XqB2pf6y9GXfCRfQKfhRaiviA6ouzALS/pub?output=csv";
let products = [];
let cart = [];
let activeCategory = "Espetos";

// Elementos DOM
const categoriesContainer = document.getElementById("categories-container");
const productsGrid = document.getElementById("products-grid");
const searchInput = document.getElementById("search-input");
const cartBtn = document.getElementById("cart-btn");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const closeCartBtn = document.getElementById("close-cart");
const cartBadge = document.getElementById("cart-badge");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalPrice = document.getElementById("cart-total-price");
const checkoutBtn = document.getElementById("checkout-btn");

// Função para converter links do Google Drive para URL de export/thumbnail direta
function convertDriveLink(url) {
  if (!url) return "";

  // Se for um link do Google Drive (/file/d/ID/view ou /d/ID)
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w800`;
  }

  return url;
}

// Helper para parsear CSV manualmente com suporte a aspas e vírgulas embutidas
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length <= 1) return [];

  function parseCSVLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ""));
    return values;
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  return lines.slice(1).map((line, index) => {
    const cleanValues = parseCSVLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = cleanValues[i] || "";
    });

    const imageUrl = row.imagem || row.image || "";
    const priceStr = (row.preco || row.price || "0")
      .toString()
      .trim()
      .replace("R$", "")
      .replace(/\s+/g, "")
      .replace(",", ".");

    let catFormatted = row.categoria || row.category || "Geral";
    if (catFormatted) {
      catFormatted = catFormatted.trim();
      catFormatted = catFormatted.charAt(0).toUpperCase() + catFormatted.slice(1).toLowerCase();
    }

    return {
      id: parseInt(row.id) || index + 1,
      name: row.nome || row.name || `Item ${index + 1}`,
      category: catFormatted,
      price: parseFloat(priceStr) || 0,
      description: row.descricao || row.description || row.desc || "",
      image: convertDriveLink(imageUrl),
    };
  });
}

// Fallback estático com a totalidade dos produtos de SummerProducts.csv para execução via protocol file://
const EMBEDDED_PRODUCTS = [
  { id: 1, category: "Espetos", name: "Carne Bovina", description: "Mix de Carnes Nobres, Alcatra, Bananinha, Fraldinha", price: 10.00, image: convertDriveLink("https://drive.google.com/file/d/1AZMEi_M-i4N1GwoMaQWh8JiIKjsrgBPs/view?usp=drive_link") },
  { id: 2, category: "Espetos", name: "Medalhão de Frango", description: "Envolto em bacon", price: 10.00, image: convertDriveLink("https://drive.google.com/file/d/1SRv2HLDW0MSHO0zwNBhjg-PJGyp5UxjY/view?usp=drive_link") },
  { id: 3, category: "Espetos", name: "Coração", description: "Coração de frango temperado", price: 10.00, image: convertDriveLink("https://drive.google.com/file/d/1ogg7byP5HjIN3cRq3c_zKODBZek-TuPZ/view?usp=drive_link") },
  { id: 4, category: "Espetos", name: "Linguiça", description: "Linguiça", price: 10.00, image: convertDriveLink("https://drive.google.com/file/d/1UR5JrBspHjIefQNFQ2wHsQkwImhD1OLK/view?usp=drive_link") },
  { id: 5, category: "Espetos", name: "Kafta com Queijo", description: "Recheada com queijo", price: 14.90, image: convertDriveLink("https://drive.google.com/file/d/1xz5vtRRInmeFHm_M07CCbpW3tOtdWKS9/view?usp=drive_link") },
  { id: 6, category: "Espetos", name: "Panceta", description: "Panceta pururuca", price: 10.00, image: convertDriveLink("https://drive.google.com/file/d/10wVKl74lLkIHree0hpf9EouUebQoS0QQ/view?usp=drive_link") },
  { id: 7, category: "Espetos", name: "Medalhão de Quiabo", description: "Quiabo com bacon", price: 10.00, image: convertDriveLink("https://drive.google.com/file/d/1lvWonaSOBfRLElTyRJfxIoBrGEyrvuIt/view?usp=drive_link") },
  { id: 8, category: "Espetos", name: "Queijo Coalho", description: "Queijo coalho na brasa", price: 11.90, image: convertDriveLink("https://drive.google.com/file/d/1_8lytzg2-z5boWXxzBAI6xOkKgktGZgQ/view?usp=drive_link") },
  { id: 9, category: "Espetos", name: "Medalhão de Queijo", description: "Queijo com bacon", price: 11.90, image: convertDriveLink("https://drive.google.com/file/d/1vBsXaqZJFiP0KAwFLrUbTiJHVIKakFRq/view?usp=drive_link") },
  { id: 10, category: "Espetos", name: "Provolone", description: "Provolone defumado", price: 11.90, image: convertDriveLink("https://drive.google.com/file/d/1tckxiVnaDj4laYdq94LivtrhvXqW3iE_/view?usp=drive_link") },
  { id: 11, category: "Espetos", name: "Pão de Alho", description: "Pão de alho recheado", price: 8.50, image: convertDriveLink("https://drive.google.com/file/d/14T9e74PytlbVVSXJp3HF4nahfRcApNNL/view?usp=drive_link") },
  { id: 12, category: "Espetos", name: "Jantinha Completa", description: "Acompanha arroz, vinagrete e batata frita e um espeto do cardápio", price: 22.90, image: convertDriveLink("https://drive.google.com/file/d/1Lp7jDfQzbCfmBypFOx_MIypuOdzbCT61/view?usp=drive_link") },
  { id: 13, category: "Porcoes", name: "Bolinho Tilápia com Queijo", description: "Porção com molho especial", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/1Wee0cr3UDW4Ez3RzW_2tbBH8uNokOHJk/view?usp=drive_link") },
  { id: 14, category: "Porcoes", name: "Bolinho Costela", description: "Costela desfiada", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/1yat8foRh-GxVXgr7aadP4u6knabcu_tq/view?usp=drive_link") },
  { id: 15, category: "Porcoes", name: "Bolinho Carne Seca com Mandioca", description: "Tradicional", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/11tTbr2l2et17JLKenmcfOAr-6QFeDzL0/view?usp=drive_link") },
  { id: 16, category: "Porcoes", name: "Bolinho Mandioqueijo", description: "Massa de mandioca com queijo", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/1Wee0cr3UDW4Ez3RzW_2tbBH8uNokOHJk/view?usp=drive_link") },
  { id: 17, category: "Porcoes", name: "Coxinha Cremosa", description: "Coxinha de frango com catupiry", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/1mY-H8lfZtcp1ImT-hxAC_yfDZeT4RizB/view?usp=drive_link") },
  { id: 18, category: "Porcoes", name: "Pérola de Queijo Canastra", description: "Queijo canastra empanado", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/1aq1FWB9pBcjiuvnv0sjpyGChjuWue14O/view?usp=drive_link") },
  { id: 19, category: "Porcoes", name: "Batata Frita (Meia Porção)", description: "Porção menor de batata frita", price: 16.90, image: convertDriveLink("https://drive.google.com/file/d/1oz7xLvrzTkpPmfEBrLCno8zG1diyk0wu/view?usp=drive_link") },
  { id: 20, category: "Porcoes", name: "Batata Frita", description: "Batata frita 500g, Adicionais: Bacon, Catupiry, cheddar e muçarela. Adicional un(R$4,00)", price: 26.90, image: convertDriveLink("https://drive.google.com/file/d/1IlawdsLSLCUEJyh_BDUSotPwv4gUo9dh/view?usp=drive_link") },
  { id: 21, category: "Porcoes", name: "Bolinho Alho Poró", description: "Sabor marcante", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/1sUrcCFyfdTS_MtAhW0JVfzjECRjvqLtr/view?usp=drive_link") },
  { id: 22, category: "Porcoes", name: "Bolinho de Feijoada", description: "Recheado com couve e torresmo", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/1u6_P-8y5o5HiJPPzRYsbZDWO-q8beihh/view?usp=drive_link") },
  { id: 23, category: "Porcoes", name: "Costelinha Barbecue", description: "Costelinha suína ao molho barbecue", price: 64.90, image: convertDriveLink("https://drive.google.com/file/d/1iTCoY5J2mDvpQm2LP8Mo8OguMKsvIvsV/view?usp=drive_link") },
  { id: 24, category: "Porcoes", name: "Isca de Tilápia", description: "Filé de tilápia empanado", price: 45.90, image: convertDriveLink("https://drive.google.com/file/d/10TkJ58VcTZ4QHDdEj724P3f-Cssxgyiv/view?usp=drive_link") },
  { id: 25, category: "Porcoes", name: "Tábua de 4 Mini Hambúrgueres", description: "Mini Hambúrgeres Artesanais ( Pão brioche, Carne, Muçarela, Bacon, Alface e Catupiriy/Cheddar)", price: 44.90, image: convertDriveLink("https://drive.google.com/file/d/11Sq9pFpDywjpgOjxixTfv958zkSqOItt/view?usp=drive_link") },
  { id: 26, category: "Porcoes", name: "Tábua de 6 Mini Hambúrgueres", description: "Tábua Grande", price: 55.90, image: convertDriveLink("https://drive.google.com/file/d/1UROjW430-U0uqbb2G9SPEH5181_4isfB/view?usp=drive_link") },
  { id: 27, category: "Porcoes", name: "Isca de Frango", description: "Frango empanado crocante", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/1PQ0eiMlapRki7UBgg103HmzHsNNIBc4F/view?usp=drive_link") },
  { id: 28, category: "Porcoes", name: "Salada", description: "Alface, tomate cereja, azeitona e muçarela", price: 16.90, image: convertDriveLink("https://drive.google.com/file/d/16o1Jr4vBvxDiTwwRJAeerI5AyOJvOU1U/view?usp=drive_link") },
  { id: 29, category: "Porcoes", name: "Torresmo", description: "Torresmo de rolo sequinho, acompanhado de mandioca frita, catupiry e muçarela", price: 45.90, image: convertDriveLink("https://drive.google.com/file/d/1ku5znFSbfN16yvLn6UVd2DYKthrUdTNm/view?usp=drive_link") },
  { id: 30, category: "Porcoes", name: "Kibe com Queijo", description: "Kibe recheado", price: 32.90, image: convertDriveLink("https://drive.google.com/file/d/1xJ7zooaefGNCePe8To_83j4E21IRekrw/view?usp=drive_link") },
  { id: 31, category: "Porcoes", name: "Mandioca Frita (Meia Porção)", description: "Porção menor de mandioca", price: 7.90, image: convertDriveLink("https://drive.google.com/file/d/1UXX3MeDEJyGrtjqhBcZrP_q7hdGAhv9x/view?usp=drive_link") },
  { id: 32, category: "Porcoes", name: "Mandioca Frita", description: "Mandioca crocante", price: 16.00, image: convertDriveLink("https://drive.google.com/file/d/1lsGmfvoi4UXbRa3MDHgEZ5Uar_hNvALI/view?usp=drive_link") },
  { id: 33, category: "Porcoes", name: "Petiscos", description: "Variados da casa", price: 12.90, image: convertDriveLink("https://drive.google.com/file/d/1y-0AcOSMwg6FDlhq3Ebx4ld1wueLKzcX/view?usp=drive_link") },
  { id: 34, category: "Cervejas", name: "Corona Zero Long Neck", description: "Sem álcool", price: 10.90, image: convertDriveLink("https://drive.google.com/file/d/12w3ot0Fmc83Zqm1VCXthBiWb5C5EvKkU/view?usp=drive_link") },
  { id: 35, category: "Cervejas", name: "Skol Beats Sense 269ml", description: "Lata 269ml", price: 9.90, image: convertDriveLink("https://drive.google.com/file/d/16bV4CUDSesxF-lE0BoTtNXUUVGOPdslg/view?usp=drive_link") },
  { id: 36, category: "Cervejas", name: "Heineken Zero Long Neck", description: "Sem álcool", price: 8.90, image: convertDriveLink("https://drive.google.com/file/d/10--FOecVzIem7ywscuj6M2wPxyNmFS93/view?usp=drive_link") },
  { id: 37, category: "Cervejas", name: "Michelob Long Neck", description: "Low Carb", price: 9.90, image: convertDriveLink("https://drive.google.com/file/d/11blCd1Flenj5WGO8ysPCZ63k4iRl7SvG/view?usp=drive_link") },
  { id: 38, category: "Cervejas", name: "Chopp Caneca 300ml", description: "Chopp Pilsen Palazzo", price: 6.80, image: convertDriveLink("https://drive.google.com/file/d/1ZS021C_dJKbjRhsa7mK6ZYzoJc-DjKxz/view?usp=drive_link") },
  { id: 39, category: "Cervejas", name: "Stella Pure Gold", description: "Sem glúten", price: 9.90, image: convertDriveLink("https://drive.google.com/file/d/1c6EpwVhLhwAHUihJqNTZPRnVkj3LQ648/view?usp=drive_link") },
  { id: 40, category: "Cervejas", name: "Império Lager 600", description: "Garrafa 600ml", price: 9.90, image: convertDriveLink("https://drive.google.com/file/d/1NypcSwaKsnr1iq_Yp4SiB7bJ0B8wKoUT/view?usp=drive_link") },
  { id: 41, category: "Cervejas", name: "Antarctica 600ml", description: "Garrafa 600ml", price: 10.90, image: convertDriveLink("https://drive.google.com/file/d/1fJ8rwPm2xIMsHAUNOnY4M-UTJfD0SHXe/view?usp=drive_link") },
  { id: 42, category: "Cervejas", name: "Original", description: "Garrafa 600ml", price: 12.90, image: convertDriveLink("https://drive.google.com/file/d/1d6ZsABx_kogqF10fhY6992TziJ1wBSqF/view?usp=drive_link") },
  { id: 43, category: "Cervejas", name: "Heineken", description: "Garrafa 600ml", price: 15.90, image: convertDriveLink("https://drive.google.com/file/d/17kxDJeq_ZSEGVp5L1TulhA5fT2dxnU5Y/view?usp=drive_link") },
  { id: 44, category: "Cervejas", name: "Stella 600ml", description: "Garrafa 600ml", price: 12.90, image: convertDriveLink("https://drive.google.com/file/d/1SUWoEUoI74yitPfcv2HkBH6PuDpWvvpE/view?usp=drive_link") },
  { id: 45, category: "Cervejas", name: "Brahma", description: "Garrafa 600ml", price: 10.90, image: convertDriveLink("https://drive.google.com/file/d/1tYCy4IdGV10SFrUjREuISUXGkG4h7bEb/view?usp=drive_link") },
  { id: 46, category: "Cervejas", name: "Spaten 600ml", description: "Garrafa 600ml", price: 12.90, image: convertDriveLink("https://drive.google.com/file/d/1rhGnJtu-YTC-0J0-VZ31uyn4nWFjFp8y/view?usp=drive_link") },
  { id: 47, category: "Cervejas", name: "Corona Long Neck", description: "Garrafa long neck", price: 10.90, image: convertDriveLink("https://drive.google.com/file/d/1BCS30nwEy26aXBEmMxCwh5kXXdJf7UnX/view?usp=drive_link") },
  { id: 48, category: "Drinks", name: "Caipirinha de Limão", description: "(Vodka ou Cachaça)", price: 19.90, image: convertDriveLink("https://drive.google.com/file/d/1ge4N9roJ2nOTsJ4OlqDrMV2mZeDM6GJs/view?usp=drive_link") },
  { id: 49, category: "Drinks", name: "Caipirinha de Limão com Abacaxi", description: "(Vodka ou Cachaça)", price: 19.90, image: convertDriveLink("https://drive.google.com/file/d/1ge4N9roJ2nOTsJ4OlqDrMV2mZeDM6GJs/view?usp=drive_link") },
  { id: 50, category: "Drinks", name: "Caipirinha de Abacaxi", description: "(Vodka ou Cachaça)", price: 19.90, image: convertDriveLink("https://drive.google.com/file/d/1ge4N9roJ2nOTsJ4OlqDrMV2mZeDM6GJs/view?usp=drive_link") },
  { id: 51, category: "Drinks", name: "Caipirinha de Morango", description: "(Vodka ou Cachaça)", price: 19.90, image: convertDriveLink("https://drive.google.com/file/d/1ge4N9roJ2nOTsJ4OlqDrMV2mZeDM6GJs/view?usp=drive_link") },
  { id: 52, category: "Drinks", name: "Caipirinha de Kiwi", description: "(Vodka ou Cachaça)", price: 19.90, image: convertDriveLink("https://drive.google.com/file/d/1ge4N9roJ2nOTsJ4OlqDrMV2mZeDM6GJs/view?usp=drive_link") },
  { id: 53, category: "Drinks", name: "Lagoa Azul", description: "Curaçao Blue, vodka e H2O Limoneto", price: 24.90, image: convertDriveLink("https://drive.google.com/file/d/18U4aHAnuhseqB2W_ySUVGBJeOlIluSmH/view?usp=drive_link") },
  { id: 54, category: "Drinks", name: "Gin", description: "Gin Beefeater", price: 24.90, image: convertDriveLink("https://drive.google.com/file/d/1vWPyfqOwrz_ahWn2lAx397hTB5eOjU1C/view?usp=drive_link") },
  { id: 55, category: "Drinks", name: "Gin Tônica", description: "Gin, Suco de Limão e Água Tônica", price: 24.90, image: convertDriveLink("https://drive.google.com/file/d/1JZsXBC-2RZenEauJlyGTutJq6q6lK32q/view?usp=drive_link") },
  { id: 56, category: "Drinks", name: "Gin Tropical", description: "Gin, Suco de Limão e RedBull Tropical", price: 24.90, image: convertDriveLink("https://drive.google.com/file/d/1ofp1YKbGj1XBRPXg5pj4COnPBL--5Dnw/view?usp=drive_link") },
  { id: 57, category: "Drinks", name: "Gin Melancia", description: "Gin de Melancia, Energético de Melancia", price: 24.90, image: convertDriveLink("https://drive.google.com/file/d/1YyntgqpOQfz8RQ6AaNoTCdpuaNTg3UqC/view?usp=drive_link") },
  { id: 58, category: "Drinks", name: "Campari Dose", description: "Dose com Gelo", price: 12.90, image: convertDriveLink("https://drive.google.com/file/d/18Twac2lgfOuqCajm_v4JB8I6XSr-h6v2/view?usp=drive_link") },
  { id: 59, category: "Drinks", name: "Campari com Laranja", description: "Campari com suco natural", price: 24.90, image: convertDriveLink("https://drive.google.com/file/d/1jIKKlJJJTN6VlCvk1PDNCgVmCAaZo_m-/view?usp=drive_link") },
  { id: 60, category: "Drinks", name: "Dose Nelson", description: "Dose especial da casa: cachaça artesanal de engenho", price: 7.00, image: convertDriveLink("https://drive.google.com/file/d/1Fx8XPU59bWLUr1LHcM3LXji1biHE5bAs/view?usp=drive_link") },
  { id: 61, category: "Drinks", name: "Dose", description: "Dose Velho Barreiro", price: 4.99, image: convertDriveLink("https://drive.google.com/file/d/1nhfhGlQb5mG7rUGNRLT5X1ayIgCxnlRI/view?usp=drive_link") },
  { id: 62, category: "Drinks", name: "Dose Red Label", description: "Whisky escocês", price: 12.90, image: convertDriveLink("https://drive.google.com/file/d/1d4nEOwcubmMDHn7aazb-wARIVkrqc-Q8/view?usp=drive_link") },
  { id: 63, category: "Drinks", name: "CDB", description: "Limão, Sal e Gelo", price: 4.50, image: convertDriveLink("https://drive.google.com/file/d/1pWzTw4GpLYqTEzu-cCXQoqbfTagO3RO8/view?usp=drive_link") },
  { id: 64, category: "Bebidas", name: "Coca Cola Lata", description: "Lata 350ml", price: 6.50, image: convertDriveLink("https://drive.google.com/file/d/1fIa77nK8VejMXioZW290N3WErjMFl6Tg/view?usp=drive_link") },
  { id: 65, category: "Bebidas", name: "Coca Zero Lata", description: "Lata 350ml", price: 6.50, image: convertDriveLink("https://drive.google.com/file/d/1GO0uk1MQgp-8NDXFvyTtGp0OmeOpaxWN/view?usp=drive_link") },
  { id: 66, category: "Bebidas", name: "Pepsi Lata", description: "Lata 350ml", price: 6.50, image: convertDriveLink("https://drive.google.com/file/d/1YhZHkZgmeOLdICWyTTDoEiMxHtdko-Xy/view?usp=drive_link") },
  { id: 67, category: "Bebidas", name: "Pepsi Black Lata", description: "Lata 350ml", price: 6.50, image: convertDriveLink("https://drive.google.com/file/d/1mKf-RVK8QzQZ2V_AdzZ05R7dDyUTCgvQ/view?usp=drive_link") },
  { id: 68, category: "Bebidas", name: "Guaraná Lata", description: "Lata 350ml", price: 6.50, image: convertDriveLink("https://drive.google.com/file/d/1jJSn41bLDU9hL8J9KIRCvj_IX7PXr0St/view?usp=drive_link") },
  { id: 69, category: "Bebidas", name: "Guaraná Zero", description: "Lata 350ml", price: 6.50, image: convertDriveLink("https://drive.google.com/file/d/1SOw0EItDVkLQRy1fOc1Zbryjhtd_4nhA/view?usp=drive_link") },
  { id: 70, category: "Bebidas", name: "Água", description: "Sem gás 500ml", price: 3.90, image: convertDriveLink("https://drive.google.com/file/d/1yKb6ogUDgxmwg_UHSSs_ZO974GMI5n_8/view?usp=drive_link") },
  { id: 71, category: "Bebidas", name: "Água com Gás", description: "Garrafa 500ml", price: 5.00, image: convertDriveLink("https://drive.google.com/file/d/1lod31q1PZMDpv3E6Y7MdFl09MgUuasz7/view?usp=drive_link") },
  { id: 72, category: "Bebidas", name: "Suco Copo", description: "Copo 300ml", price: 8.90, image: convertDriveLink("https://drive.google.com/file/d/1-ysm4u606TMRjLdu_AVx09702cMlfteD/view?usp=drive_link") },
  { id: 73, category: "Bebidas", name: "Suco Jarra", description: "Jarra 900 ml", price: 17.90, image: convertDriveLink("https://drive.google.com/file/d/1hiCkiakR5S8iWYWo-dJ18PB0VXxDtVDn/view?usp=drive_link") },
  { id: 74, category: "Bebidas", name: "Redbull Zero 250 ml", description: "Lata 250ml", price: 12.00, image: convertDriveLink("https://drive.google.com/file/d/1_fKROaCSzDQqiwoTfjFy-uUkoXqcReqy/view?usp=drive_link") },
  { id: 75, category: "Bebidas", name: "Limoneto H2O", description: "Garrafa 500ml", price: 8.00, image: convertDriveLink("https://drive.google.com/file/d/13DzpYAE9gheZ2iWxEwVQ3kdRq9KT1rFP/view?usp=drive_link") },
  { id: 76, category: "Bebidas", name: "Água Tônica", description: "Lata 350ml", price: 6.50, image: convertDriveLink("https://drive.google.com/file/d/1a7JrTVE6k4IUYbz6t0gP8RYEfqr5th9g/view?usp=drive_link") },
  { id: 77, category: "Bebidas", name: "Redbull 250ml", description: "Lata 250ml", price: 12.00, image: convertDriveLink("https://drive.google.com/file/d/11E_Oo_Yj3OlzZiMUDfJvv_7lRicHRXHO/view?usp=drive_link") },
  { id: 78, category: "Bebidas", name: "Gatorade Sabores", description: "Morango & Maracujá, Uva, Limão e Berry Blue", price: 8.00, image: convertDriveLink("https://drive.google.com/file/d/14wAKYP-K1Te8Ru4EIrR8fAAr7THmzE-b/view?usp=drive_link") },
  { id: 79, category: "Diversos", name: "Amendoim", description: "Sabores AmendoAlho & AmendoLemon", price: 4.99, image: convertDriveLink("https://drive.google.com/file/d/14nmWf2vRPR2v8V68Pebuw3yZsTX9Ttdo/view?usp=drive_link") },
  { id: 80, category: "Diversos", name: "Barra de Proteína", description: "Deliciosa e Fit, pra saciar sua fome por um docinho", price: 10.00, image: convertDriveLink("https://drive.google.com/file/d/1Id_L8zF5X7_JaGMMtYZ4gKl957MDahOn/view?usp=drive_link") },
  { id: 81, category: "Diversos", name: "Trident", description: "Chiclete de Hortelã", price: 3.00, image: convertDriveLink("https://drive.google.com/file/d/12hN_UiGLf3P5M1TIUckmrn54IJGK3zdI/view?usp=drive_link") },
  { id: 82, category: "Diversos", name: "Gelo", description: "Saco adicional", price: 2.00, image: convertDriveLink("https://drive.google.com/file/d/1kKuN11eu7coKeBRm1ma6u1LfqXrkodKF/view?usp=drive_link") },
  { id: 83, category: "Diversos", name: "Cigarro Paulistinha", description: "Sabores Tradicional & Menta", price: 3.00, image: convertDriveLink("https://drive.google.com/file/d/1xJNSc-T48rVHHbMUW1x0C88x-CsuMTko/view?usp=drive_link") },
  { id: 84, category: "Diversos", name: "Halls", description: "Unidade", price: 3.00, image: convertDriveLink("https://drive.google.com/file/d/1eYRXWRXGq2XvIUJtl90c8pt4p809Td-E/view?usp=drive_link") }
];

// Helper: parseia CSV bruto (PapaParse ou fallback manual) → array de produtos normalizados
function parseCsvToProducts(csvText) {
  let rows;
  if (typeof Papa !== "undefined") {
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    rows = parsed.data;
  } else {
    rows = parseCSV(csvText);
    return rows; // parseCSV já retorna formato normalizado
  }

  return rows.map((rawRow, index) => {
    const row = {};
    Object.keys(rawRow).forEach((k) => {
      if (k) row[k.trim().toLowerCase()] = rawRow[k];
    });

    const imageUrl = row.imagem || row.image || "";
    const priceStr = (row.preco || row.price || "0")
      .toString().trim()
      .replace("R$", "").replace(/\s+/g, "").replace(",", ".");

    let catFormatted = row.categoria || row.category || "Geral";
    if (catFormatted) {
      catFormatted = catFormatted.trim();
      catFormatted = catFormatted.charAt(0).toUpperCase() + catFormatted.slice(1).toLowerCase();
    }

    return {
      id: parseInt(row.id) || index + 1000,
      name: row.nome || row.name || `Item ${index + 1}`,
      category: catFormatted,
      price: parseFloat(priceStr) || 0,
      description: row.desc || row.descricao || row.description || "",
      image: convertDriveLink(imageUrl),
    };
  });
}

// Estratégia Stale-While-Revalidate:
//   1. Renderiza IMEDIATAMENTE com EMBEDDED_PRODUCTS (zero delay)
//   2. Busca Google Sheets em background (silenciosamente)
//   3. Quando chegar → re-renderiza com dados atualizados da planilha
//   4. Se falhar (offline, file://, timeout) → mantém o que já está na tela
async function loadSheetData() {
  // — FASE 1: Render imediato com dados embutidos (instantâneo) —
  products = EMBEDDED_PRODUCTS;
  renderCategories();
  filterProducts();
  console.log(`✅ Cardápio renderizado instantaneamente (${products.length} produtos embutidos).`);

  // — FASE 2: Busca assíncrona em background do Google Sheets —
  fetchSheetInBackground();
}

async function fetchSheetInBackground() {
  try {
    const t0 = performance.now();
    const response = await fetch(SHEETS_CSV_URL, {
      // cache: 'no-store' garante dados frescos da planilha a cada visita
      cache: "no-store",
      signal: AbortSignal.timeout(8000), // timeout de 8s — se demorar mais, desiste
    });

    if (!response.ok) {
      console.warn(`⚠️ Google Sheets retornou HTTP ${response.status}. Mantendo dados embutidos.`);
      return;
    }

    const csvText = await response.text();
    const elapsed = (performance.now() - t0).toFixed(0);

    if (!csvText || csvText.trim().startsWith("<!DOCTYPE")) {
      console.warn("⚠️ Resposta do Google Sheets não é CSV válido. Mantendo dados embutidos.");
      return;
    }

    const freshProducts = parseCsvToProducts(csvText);
    if (!freshProducts || freshProducts.length === 0) {
      console.warn("⚠️ Nenhum produto parseado da planilha. Mantendo dados embutidos.");
      return;
    }

    // Atualiza silenciosamente — re-renderiza apenas se a categoria ativa ainda existir
    products = freshProducts;
    const activeCatStillExists = products.some(
      (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
    );
    if (!activeCatStillExists) activeCategory = products[0]?.category || "Espetos";

    renderCategories();
    filterProducts();
    console.log(`🔄 Cardápio atualizado da planilha Google Sheets em ${elapsed}ms (${products.length} produtos).`);

  } catch (e) {
    if (e.name === "TimeoutError") {
      console.warn("⏱️ Timeout ao buscar planilha (>8s). Mantendo dados embutidos.");
    } else {
      console.warn("⚠️ Não foi possível buscar a planilha:", e.message, "— Mantendo dados embutidos.");
    }
  }
}

function renderCategories() {
  const ORDERED_CATEGORIES = ["Espetos", "Porcoes", "Cervejas", "Bebidas", "Drinks", "Diversos"];
  const existingCategories = Array.from(new Set(products.map((p) => p.category)));

  // Ordena de acordo com a ordem definida em ORDERED_CATEGORIES
  const categoriesList = ORDERED_CATEGORIES.filter((cat) =>
    existingCategories.some((c) => c.toLowerCase() === cat.toLowerCase())
  );

  // Adiciona quaisquer outras categorias não listadas no final
  existingCategories.forEach((cat) => {
    if (!categoriesList.some((c) => c.toLowerCase() === cat.toLowerCase())) {
      categoriesList.push(cat);
    }
  });

  // Ícones do Material Symbols para cada categoria no menu lateral
  const categoryIcons = {
    espetos: "outdoor_grill",
    porcoes: "restaurant",
    cervejas: "sports_bar",
    bebidas: "local_drink",
    drinks: "local_bar",
    diversos: "more_horiz",
  };

  if (categoriesContainer) {
    categoriesContainer.innerHTML = categoriesList
      .map((cat) => {
        const rawLabel = cat.toLowerCase() === "porcoes" ? "Porções" : cat;
        const displayLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase();
        const isActive = cat.toLowerCase() === activeCategory.toLowerCase();

        return `
      <button id="cat-btn-${cat.toLowerCase()}" class="cat-btn ${isActive ? "active" : ""}" onclick="filterCategory('${cat}')">
        ${displayLabel}
      </button>
    `;
      })
      .join("");
  }

  // Renderiza também a lista de atalhos no Side Drawer lateral
  const sidebarContainer = document.getElementById("sidebar-categories");
  if (sidebarContainer) {
    sidebarContainer.innerHTML = categoriesList
      .map((cat) => {
        const displayLabel = cat.toLowerCase() === "porcoes" ? "Porções" : cat;
        const isActive = cat.toLowerCase() === activeCategory.toLowerCase();
        const icon = categoryIcons[cat.toLowerCase()] || "category";

        return `
      <button onclick="selectCategoryFromSidebar('${cat}')" class="sidebar-cat-btn ${isActive ? "active" : ""}">
        <span class="material-symbols-outlined" style="font-size: 20px;">${icon}</span>
        <span>${displayLabel}</span>
      </button>
    `;
      })
      .join("");
  }
}

function selectCategoryFromSidebar(cat) {
  filterCategory(cat);
  const menuDrawer = document.getElementById("menu-drawer");
  if (menuDrawer) {
    if (typeof gsap !== "undefined") {
      gsap.to("#menu-overlay", {
        x: "-100%",
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          menuDrawer.classList.add("hidden");
        }
      });
    } else {
      menuDrawer.classList.add("hidden");
    }
  }
}

// Retorna promoções ativas com base no dia da semana e hora atual
function getActivePromos() {
  const now = new Date();
  const day = now.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  const hour = now.getHours();
  const promos = {};

  // === PROMOÇÃO QUARTA-FEIRA ===
  if (day === 3) {
    // Espetos em promoção a R$ 7,90 (exceto Kafta id:5, Queijo Coalho id:8, Provolone id:10, Medalhão de Queijo id:9, Jantinha id:12)
    const excludedIds = [5, 8, 9, 10, 12];
    products
      .filter((p) => p.category === "Espetos" && !excludedIds.includes(p.id))
      .forEach((p) => {
        promos[p.id] = { promoPrice: 7.90, promoLabel: "◆ ESPETO PROMO ◆", badgeClass: "badge-quarta" };
      });
    // Heineken 600ml (id: 43 após renumeração do cardápio) a R$ 12,90
    promos[43] = { promoPrice: 12.90, promoLabel: "◆ HEINEKEN PROMO ◆", badgeClass: "badge-quarta" };
  }

  // === PROMOÇÃO QUINTA-FEIRA ===
  if (day === 4) {
    // Caipirinhas em Dobro: cada uma a R$ 9,90 (ids 48–52 após renumeração do cardápio)
    [48, 49, 50, 51, 52].forEach((id) => {
      promos[id] = { promoPrice: 9.90, promoLabel: "2X CAIPIRINHA", badgeClass: "badge-quinta" };
    });
    // Batata Frita a R$ 22,90
    promos[20] = { promoPrice: 22.90, promoLabel: "◆ QUINTA PROMO ◆", badgeClass: "badge-quinta" };
  }

  // === TODOS OS DIAS (Antes das 00:00) → Chopp a R$ 3,40 com Tag Promo ===
  // Após as 00:00 (entre 00:00 e 05:59), a tag é removida e o valor fica R$ 6,80
  if (!(hour >= 0 && hour < 6)) {
    promos[38] = { promoPrice: 3.40, promoLabel: "CHOPP PROMO", badgeClass: "badge-chopp" };
  }

  return promos;
}

function renderProducts(items) {
  if (!productsGrid) return;

  if (items.length === 0) {
    productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem; font-weight: bold;">Nenhum item encontrado nesta categoria.</p>`;
    return;
  }

  const activePromos = getActivePromos();

  // Ordena alfabeticamente por nome antes de renderizar
  const sortedItems = [...items].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
  );

  productsGrid.innerHTML = sortedItems
    .map((item) => {
      const promo = activePromos[item.id];
      const hasPromo = !!promo;
      const displayPrice = hasPromo ? promo.promoPrice : item.price;

      return `
    <div class="product-card-item${hasPromo ? ' promo-card' : ''}" onclick="openProductModal(${item.id})" role="button" tabindex="0" aria-label="Ver detalhes de ${item.name}">
      ${hasPromo ? `
        <div class="promo-badge-tag ${promo.badgeClass || ''}">${promo.promoLabel}</div>
      ` : ''}
      ${
        item.image
          ? `
        <div class="product-card-image-box">
          <img src="${item.image}" alt="${item.name}" 
               class="product-card-img" 
               loading="lazy"
               onerror="this.onerror=null; this.src='SummerBeachSportsBarVazado.svg'; this.style.objectFit='contain'; this.style.padding='0.5rem';">
          <span class="product-card-category-tag">${item.category}</span>
        </div>
      `
          : ""
      }
      <div class="product-card-body">
        <h4 class="product-card-title">${item.name}</h4>
        ${item.description ? `<p class="product-card-desc">${item.description}</p>` : ""}
      </div>
      <div class="product-card-footer">
        ${hasPromo ? `
          <div style="display: flex; flex-direction: column;">
            <span class="product-price-old">R$ ${item.price.toFixed(2).replace(".", ",")}</span>
            <span class="product-price-promo">R$ ${displayPrice.toFixed(2).replace(".", ",")}</span>
          </div>
          <span class="product-mini-promo-pill">PROMO</span>
        ` : `
          <span class="product-price-regular">R$ ${displayPrice.toFixed(2).replace(".", ",")}</span>
        `}
      </div>
    </div>
  `;
    })
    .join("");

  // Animação GSAP de entrada dos cards com efeito Stagger suave
  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      ".product-card-item",
      { opacity: 0, y: 16, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.04, ease: "power2.out" }
    );
  }

  // Recalcula alturas de scroll caso o DOM tenha mudado de tamanho
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.refresh();
  }
}

// Pop-up Modal de Detalhes do Produto (Visualização Ampliada)
function openProductModal(id) {
  const item = products.find((p) => p.id === id);
  if (!item) return;

  const modal = document.getElementById("product-modal");
  const modalContent = document.getElementById("product-modal-content");
  if (!modal || !modalContent) return;

  const activePromos = getActivePromos();
  const promo = activePromos[item.id];
  const hasPromo = !!promo;
  const displayPrice = hasPromo ? promo.promoPrice : item.price;
  const wppText = encodeURIComponent(`Olá! Gostaria de pedir: *${item.name}* (${item.category}) no Summer Sport Bar.`);

  modalContent.innerHTML = `
      <div class="product-modal-image-wrapper">
        ${hasPromo ? `<div class="promo-badge-tag ${promo.badgeClass || ''}" style="top: 12px; left: 50%;">${promo.promoLabel}</div>` : ''}
        <img src="${item.image || 'SummerBeachSportsBarVazado.svg'}" alt="${item.name}" class="product-modal-img" onerror="this.onerror=null; this.src='SummerBeachSportsBarVazado.svg'; this.style.objectFit='contain'; this.style.padding='1rem';">
        <span class="product-modal-badge">${item.category}</span>
      </div>
    <div class="product-modal-info">
      <div>
        <h3 class="product-modal-title">${item.name}</h3>
        ${item.description ? `<p class="product-modal-description" style="margin-top: 0.5rem;">${item.description}</p>` : ""}
      </div>

      <div class="product-modal-price-box">
        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Valor</span>
        ${hasPromo ? `
          <div style="text-align: right; display: flex; align-items: baseline; gap: 0.5rem;">
            <span class="product-price-old">R$ ${item.price.toFixed(2).replace(".", ",")}</span>
            <span class="product-price-promo" style="font-size: 1.25rem;">R$ ${displayPrice.toFixed(2).replace(".", ",")}</span>
          </div>
        ` : `
          <span class="product-price-regular" style="font-size: 1.25rem;">R$ ${displayPrice.toFixed(2).replace(".", ",")}</span>
        `}
      </div>

      <a
        href="https://wa.me/5516992911737?text=${wppText}"
        target="_blank"
        rel="noopener noreferrer"
        class="product-modal-cta-btn"
      >
        <span class="material-symbols-outlined" style="font-size: 20px;">chat</span>
        <span>Pedir pelo WhatsApp</span>
      </a>
    </div>
  `;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Bloqueia scroll de fundo

  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      modal,
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: "power2.out" }
    );
    gsap.fromTo(
      "#product-modal-dialog",
      { scale: 0.85, y: 25, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.4)" }
    );
  }
}

function closeProductModal() {
  const modal = document.getElementById("product-modal");
  if (!modal || modal.classList.contains("hidden")) return;

  document.body.style.overflow = ""; // Restaura scroll

  if (typeof gsap !== "undefined") {
    gsap.to("#product-modal-dialog", {
      scale: 0.9,
      y: 15,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in"
    });
    gsap.to(modal, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add("hidden");
      }
    });
  } else {
    modal.classList.add("hidden");
  }
}

// Pop-up Modal de Compartilhamento do Cardápio
function openShareModal() {
  // Fecha a sidebar (menu drawer) se estiver aberta
  const menuDrawer = document.getElementById("menu-drawer");
  if (menuDrawer && !menuDrawer.classList.contains("hidden")) {
    if (typeof gsap !== "undefined") {
      gsap.to("#menu-overlay", {
        x: "-100%",
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          menuDrawer.classList.add("hidden");
        }
      });
    } else {
      menuDrawer.classList.add("hidden");
    }
  }

  const shareModal = document.getElementById("share-modal");
  if (!shareModal) return;

  shareModal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Bloqueia scroll de fundo

  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      shareModal,
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: "power2.out" }
    );
    gsap.fromTo(
      "#share-modal-dialog",
      { scale: 0.85, y: 25, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.4)" }
    );
  }
}

function closeShareModal() {
  const shareModal = document.getElementById("share-modal");
  if (!shareModal || shareModal.classList.contains("hidden")) return;

  // Se o modal de produtos também não estiver aberto, restaura o scroll
  const productModal = document.getElementById("product-modal");
  if (!productModal || productModal.classList.contains("hidden")) {
    document.body.style.overflow = "";
  }

  if (typeof gsap !== "undefined") {
    gsap.to("#share-modal-dialog", {
      scale: 0.9,
      y: 15,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in"
    });
    gsap.to(shareModal, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        shareModal.classList.add("hidden");
      }
    });
  } else {
    shareModal.classList.add("hidden");
  }
}

async function copyMenuLink() {
  const linkText = window.location.href;
  const copyBtn = document.getElementById("copy-link-btn");
  const copyTextEl = document.getElementById("copy-link-text");

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(linkText);
    } else {
      // Fallback para navegadores mais antigos ou protocol file://
      const textArea = document.createElement("textarea");
      textArea.value = linkText;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    if (copyBtn && copyTextEl) {
      copyBtn.classList.add("copied");
      const originalText = copyTextEl.textContent;
      copyTextEl.textContent = "Link Copiado! ✨";
      setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyTextEl.textContent = originalText;
      }, 2500);
    }
  } catch (err) {
    console.error("Falha ao copiar link:", err);
    if (copyTextEl) copyTextEl.textContent = "Erro ao copiar. Tente novamente.";
  }
}

function shareMenuWhatsApp(e) {
  if (e) e.preventDefault();
  const url = window.location.href;
  const text = encodeURIComponent(`Confira o cardápio digital do Summer Sport Bar! 🍹🍢\nAcesse: ${url}`);
  const wppUrl = `https://api.whatsapp.com/send?text=${text}`;
  window.open(wppUrl, "_blank");
}

async function shareMenuNative() {
  const url = window.location.href;
  const shareData = {
    title: "Summer Sport Bar - Cardápio Digital",
    text: "Confira o cardápio digital do Summer Sport Bar!",
    url: url
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("Erro no Web Share API:", err);
        copyMenuLink();
      }
    }
  } else {
    // Fallback inteligente caso navigator.share não exista
    copyMenuLink();
  }
}

function filterCategory(cat) {
  activeCategory = cat;
  renderCategories();
  filterProducts();

  // Scroll automático centralizado para o botão da categoria selecionada
  const activeBtn = document.getElementById(`cat-btn-${cat.toLowerCase()}`);
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  // Garante que o footer e a página atualizem suas dimensões
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.refresh();
  }
}

function filterProducts() {
  const query = (searchInput?.value || "").toLowerCase();
  const filtered = products.filter((item) => {
    const matchesCategory =
      item.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  renderProducts(filtered);
}

function setupEvents() {
  if (searchInput) searchInput.addEventListener("input", filterProducts);
  
  // Elementos do Menu Lateral (Categorias)
  const menuBtn = document.getElementById("menu-btn");
  const menuDrawer = document.getElementById("menu-drawer");
  const closeMenuBtn = document.getElementById("close-menu");

  function openMenuDrawer() {
    if (!menuDrawer) return;
    menuDrawer.classList.remove("hidden");
    if (typeof gsap !== "undefined") {
      gsap.fromTo(
        "#menu-overlay",
        { x: "-100%" },
        { x: "0%", duration: 0.3, ease: "power3.out" }
      );
    }
  }

  function closeMenuDrawer() {
    if (!menuDrawer) return;
    if (typeof gsap !== "undefined") {
      gsap.to("#menu-overlay", {
        x: "-100%",
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          menuDrawer.classList.add("hidden");
        }
      });
    } else {
      menuDrawer.classList.add("hidden");
    }
  }

  if (menuBtn) menuBtn.addEventListener("click", openMenuDrawer);

  if (menuDrawer) {
    menuDrawer.addEventListener("click", (e) => {
      if (e.target === menuDrawer) closeMenuDrawer();
    });
  }

  if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeMenuDrawer);

  // Elementos do Pop-up Modal de Produto
  const productModal = document.getElementById("product-modal");
  const closeProductModalBtn = document.getElementById("close-product-modal");

  if (closeProductModalBtn) {
    closeProductModalBtn.addEventListener("click", closeProductModal);
  }

  if (productModal) {
    productModal.addEventListener("click", (e) => {
      if (e.target === productModal) closeProductModal();
    });
  }

  // Elementos do Pop-up Modal de Compartilhamento
  const shareModal = document.getElementById("share-modal");
  const closeShareModalBtn = document.getElementById("close-share-modal");

  if (closeShareModalBtn) {
    closeShareModalBtn.addEventListener("click", closeShareModal);
  }

  if (shareModal) {
    shareModal.addEventListener("click", (e) => {
      if (e.target === shareModal) closeShareModal();
    });
  }

  // Fecha modais com a tecla ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeProductModal();
      closeShareModal();
      closeMenuDrawer();
    }
  });

  // Efeito sutil de elevação no Header ao rolar
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(".app-header", {
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "+=80",
        scrub: 0.4,
      },
      paddingTop: "0.25rem",
      paddingBottom: "0.25rem",
      boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    });
  }
}

// ==========================================================================
// CONTROLE DE TEMA (DARK / LIGHT / AUTO)
// ==========================================================================

function setAppTheme(theme) {
  const root = document.documentElement;
  localStorage.setItem("summer-theme", theme);

  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    // Auto: remove data-theme explícito para respeitar o prefers-color-scheme do dispositivo
    root.removeAttribute("data-theme");
  }

  updateThemeButtonsUI(theme);
}

function updateThemeButtonsUI(activeTheme) {
  const darkBtn = document.getElementById("theme-dark-btn");
  const lightBtn = document.getElementById("theme-light-btn");
  const autoBtn = document.getElementById("theme-auto-btn");

  if (darkBtn) darkBtn.classList.toggle("active", activeTheme === "dark");
  if (lightBtn) lightBtn.classList.toggle("active", activeTheme === "light");
  if (autoBtn) autoBtn.classList.toggle("active", activeTheme === "auto");
}

function initTheme() {
  const savedTheme = localStorage.getItem("summer-theme") || "auto";
  setAppTheme(savedTheme);

  // Ouve mudanças em tempo real nas preferências de tema do sistema operacional
  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
  mediaQuery.addEventListener("change", () => {
    const current = localStorage.getItem("summer-theme") || "auto";
    if (current === "auto") {
      setAppTheme("auto");
    }
  });
}

// Inicia o carregamento e configuração
initTheme();
loadSheetData();
setupEvents();

// Status ao vivo do footer: ABERTO / FECHADO
function updateFooterStatus() {
  const el = document.getElementById("footer-status");
  if (!el) return;

  const now = new Date();
  const day = now.getDay();  // 0=Dom … 6=Sáb
  const hour = now.getHours();

  // Aberto: Quarta(3), Quinta(4), Sexta(5) e Sábado(6) após as 17h
  const openDays = [3, 4, 5, 6];
  const isOpen = openDays.includes(day) && hour >= 17;

  if (isOpen) {
    el.innerHTML = `<span class="status-dot open"></span> Aberto agora`;
    el.style.cssText = "color:#4ADE80; border-color:rgba(74,222,128,0.4); background:rgba(74,222,128,0.12);";
  } else {
    const nextOpenDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    let nextMsg = "";
    if (openDays.includes(day) && hour < 17) {
      nextMsg = "Abre hoje às 17h";
    } else {
      let next = (day + 1) % 7;
      while (!openDays.includes(next)) next = (next + 1) % 7;
      nextMsg = `Abre ${nextOpenDayNames[next]} 17h`;
    }
    el.innerHTML = `<span class="status-dot closed"></span> Fechado · ${nextMsg}`;
    el.style.cssText = "color:#F87171; border-color:rgba(248,113,113,0.4); background:rgba(248,113,113,0.12);";
  }
}

updateFooterStatus();

