(() => {
	function run() {
		for(productCard of document.querySelectorAll("dcl-product-card")) {
			updateProductCard(productCard)
		}
	}

	function parseNumberOfNights(text) {
		const m = text.match(/([0-9]+)-Night/)
		return Number(m?.[1] ?? 0)
	}

	function parsePrice(productCard) {
		const price = productCard.querySelector("wdpr-price").shadowRoot.querySelector("#price").innerText
		const currency = productCard.querySelector("wdpr-price").shadowRoot.querySelector("#currency").innerText
		return { price, currency }
	}

	function calculateRealPrice({ price, currency, numberOfNights, isConcierge }) {
		const xRateEUR2USD = 1.07;
		const isEuro = currency.match(/EUR/)
		const priceUSD = isEuro ? price * xRateEUR2USD : price;
		const costOfGratuitiesUSD = ((isConcierge ? 8 : 0) + 14.5) * 2 * numberOfNights;
		const costOfWifiUSD = 24 * numberOfNights
		const realPriceUSD = priceUSD + costOfGratuitiesUSD + costOfWifiUSD
		return isEuro ? realPriceUSD / xRateEUR2USD : realPriceUSD
	}

	function parseFormattedNumber(x) {
		if (x.match(/Unavailable/)) {
			return null
		}
		const result = x.replace(/,/g, '')
		console.log("DEBUG A", x, result, Number(result));
		return Number(result)
	}

	function updateProductCard(productCard) {
		const name = productCard.querySelector(".product-card-content__name").innerText
		const labelElement = productCard.querySelector(".product-card-pricing-row__label")
		const numberOfNights = parseNumberOfNights(name)
		console.log("DEBUG N", name, numberOfNights)
		const sailingCardPricing = productCard.querySelector("dcl-sailing-card-pricing")
		let { price, currency } = parsePrice(productCard)

		if(currency.match(/NIGHT/)) {
			price = productCard.originalPrice
			currency = productCard.originalCurrency
		} else {
			labelElement.innerHTML += " " + price + " " + currency
			price = parseFormattedNumber(price)
			productCard.originalPrice = price
			productCard.originalCurrency = currency
		}

		if(price) {
			const realPrice = calculateRealPrice({price, currency, numberOfNights});
			const realPricePerNight = realPrice / numberOfNights

			updatePrice(productCard, realPricePerNight)
			if(sailingCardPricing) {
				updateSailingCardPricing({productCard, sailingCardPricing, numberOfNights, currency})
			}
		}
	}

	function updateSailingCardPricing({productCard, sailingCardPricing, numberOfNights, currency}) {
		for(stateroomTypeElement of sailingCardPricing.querySelectorAll(".stateroom-type")) {
			const label = stateroomTypeElement.querySelector("a")?.ariaLabel
			if(label) {
				const wdprPrice = stateroomTypeElement.querySelector("wdpr-price")
				console.log("found one wdpr price", label)
				updateSailingCardWdprPrice({label, wdprPrice, numberOfNights, currency})
			}
		}
	}

	function updateSailingCardWdprPrice({ label, wdprPrice, numberOfNights, currency }) {
		const shadowRoot = wdprPrice.shadowRoot
		if(!shadowRoot) { console.log("NOSR"); return }
		const priceElement = shadowRoot.querySelector("#price")
		let price = priceElement.originalPrice
		if(!price) {
			price = parseFormattedNumber(priceElement.innerText)
			priceElement.originalPrice = price
		}

		if(price) {
			const realPrice = calculateRealPrice({ price, isConcierge: label.match(/Concierge/), wdprPrice, numberOfNights, currency })
			const realPricePerNight = realPrice / numberOfNights
			updateWdprPrice(wdprPrice, realPricePerNight)
		}
	}

	function updatePrice(productCard, newPrice) {
		const wdprPrice = productCard.querySelector("wdpr-price")
		updateWdprPrice(wdprPrice, newPrice)
	}

	function updateWdprPrice(wdprPrice, newPrice) {
		const shadowRoot = wdprPrice.shadowRoot
		const priceElement = shadowRoot.querySelector("#price")
		const currencyElement = shadowRoot.querySelector("#currency")
		let color = ""
		if (newPrice < 400) {
			color = "green"
		} else if (newPrice < 500) {
			color = "yellow"
		} else if (newPrice < 700) {
			color = "orange"
		} else {
			color = "red"
		}
		wdprPrice.style.color = color
		for (child of shadowRoot.children) {
			child.style.color = color
		}
		priceElement.innerText = newPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
		if(!currencyElement.innerText.match(/NIGHT/)) {
			currencyElement.innerText += "/NIGHT"
		}
	}


	run()
	if(top._pnint) {
		clearInterval(top._pnint)
	}
	//top._pnint = setInterval(run, 0.5e3)
})()

