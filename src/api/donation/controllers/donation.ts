/**
 * donation controller - VERSIÓN MEJORADA
 * 
 * MEJORAS:
 * ✅ Soporte para suscripciones recurrentes (monthly)
 * ✅ Manejo correcto de mode: 'subscription' vs 'payment'
 * ✅ Mejor validación de datos
 * ✅ Metadata más completa para Stripe
 * 
 * COPIAR ESTE ARCHIVO A:
 * strapi-backend/src/api/donation/controllers/donation.ts
 */

import { factories } from '@strapi/strapi'
import Stripe from 'stripe'

//@ts-ignore
const stripe = new Stripe(process.env.STRIPE_KEY as string)

export default factories.createCoreController('api::donation.donation', ({ strapi }) => ({
	// Override the default find to ensure proper serialization
	async find(ctx) {
		const sanitizedQueryParams = await this.sanitizeQuery(ctx);
		const { results, pagination } = await strapi.service('api::donation.donation').find(sanitizedQueryParams);
		const sanitizedResults = await this.sanitizeOutput(results, ctx);
		
		// Ensure pagination values are numbers, not objects
		const safePagination = {
			page: Number(pagination.page),
			pageSize: Number(pagination.pageSize),
			pageCount: Number(pagination.pageCount),
			total: typeof pagination.total === 'object' && pagination.total !== null 
				? Number(pagination.total.count || pagination.total) 
				: Number(pagination.total)
		};
		
		return this.transformResponse(sanitizedResults, { pagination: safePagination });
	},

	async createCheckoutSession(ctx) {
        //@ts-ignore
		const body = ctx.request.body as any
		const amount = Number(body?.amount)
		const donationDestiny = String(body?.donationDestiny || 'General')
		const frecuency = String(body?.frecuency || 'one-time')
		const comments = body?.comments ?? ''
		const donor = body?.donator || {}

		// Validación
		if (!amount || amount <= 0) {
			ctx.throw(400, 'Invalid amount')
		}
		if (!process.env.CLIENT_URL) {
			ctx.throw(500, 'CLIENT_URL is not configured')
		}

		// URLs de redirección
		const successUrl = `${process.env.CLIENT_URL}/donation/success?session_id={CHECKOUT_SESSION_ID}`
		const cancelUrl = `${process.env.CLIENT_URL}/donation`

		// Crear o buscar donador
		let donatorId: number | string | null = null
        if (donor?.email) {
            const existing = await strapi.entityService.findMany('api::donator.donator', {
                filters: { email: donor.email },
                limit: 1,
            })
            if (existing && existing.length > 0) {
                donatorId = existing[0].id
            } else {
				const createdDonator = await strapi.entityService.create('api::donator.donator', {
					data: {
						firstName: donor.firstName || '',
						lastName: donor.lastName || '',
						email: donor.email,
						address: donor.address || '',
						city: donor.city || '',
						phone: donor.phone || '',
						publishedAt: new Date(),
					},
				})
				donatorId = createdDonator.id
			}
		}

		// 🆕 CONFIGURACIÓN PARA SUSCRIPCIONES RECURRENTES
		const isRecurring = frecuency === 'monthly'
		
		// Line items
		const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
			{
				price_data: {
					currency: 'usd',
					product_data: { 
						name: `Donation - ${donationDestiny}`,
						description: isRecurring ? 'Monthly recurring donation' : 'One-time donation'
					},
					unit_amount: Math.round(amount * 100),
					...(isRecurring && {
						recurring: {
							interval: 'month',
							interval_count: 1,
						}
					})
				},
				quantity: 1,
			},
		]

		// Crear sesión de Stripe
		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			payment_method_types: ['card'],
			mode: isRecurring ? 'subscription' : 'payment', // 🆕 Modo dinámico
			success_url: successUrl,
			cancel_url: cancelUrl,
			line_items: lineItems,
			customer_email: donor.email || undefined,
			metadata: {
				donationDestiny,
				frecuency,
				donatorId: donatorId?.toString() || '',
			},
		}

		const session = await stripe.checkout.sessions.create(sessionParams)

		// Crear registro de donación
		const donationDate = body?.donationDate ? new Date(body.donationDate) : new Date()
		const donation = await strapi.entityService.create('api::donation.donation', {
			data: {
				donator: donatorId ? donatorId : undefined,
				amount: amount,
				donationDestiny,
				donationDate,
				succesfull: false, // Se marcará como true en confirm
				frecuency,
				comments,
				stripeId: session.id,
				publishedAt: new Date(),
			},
		})

		ctx.body = { stripeSession: session, donationId: donation.id }
	},

	async confirm(ctx) {
		const sessionId = (ctx.request.query?.session_id || ctx.request.body?.session_id) as string
		if (!sessionId) {
			ctx.throw(400, 'session_id is required')
		}

		// Obtener sesión de Stripe
		const session = await stripe.checkout.sessions.retrieve(sessionId)
		
		if (session.payment_status !== 'paid') {
			ctx.body = { status: session.payment_status, message: 'Payment not completed' }
			return
		}

		// Buscar donación por stripeId
		const donations = await strapi.entityService.findMany('api::donation.donation', {
			filters: { stripeId: sessionId },
			limit: 1,
		})

		if (!donations || donations.length === 0) {
			ctx.throw(404, 'Donation not found')
		}

		// Actualizar donación como exitosa
		const updated = await strapi.entityService.update(
			'api::donation.donation', 
			donations[0].id,
			{
				data: {
					succesfull: true,
					donationDate: new Date(),
				},
			}
		)

		ctx.body = { 
			ok: true, 
			donationId: updated.id,
			status: 'confirmed',
			isRecurring: session.mode === 'subscription'
		}
	},
}))
