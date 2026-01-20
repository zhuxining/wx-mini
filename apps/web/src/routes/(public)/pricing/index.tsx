import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/(public)/pricing/")({
	component: PricingPage,
});

function PricingPage() {
	return (
		<div className="flex min-h-screen flex-col">
			<header className="border-b">
				<nav className="container mx-auto flex items-center justify-between px-4 py-4">
					<Link to="/">
						<h1 className="font-bold text-xl">SaaS Platform</h1>
					</Link>
					<div className="flex gap-4">
						<Link to="/landing">
							<Button variant="ghost">Home</Button>
						</Link>
						<Link to="/about">
							<Button variant="ghost">About</Button>
						</Link>
						<Link to="/login">
							<Button>Get Started</Button>
						</Link>
					</div>
				</nav>
			</header>

			<main className="flex-1 bg-muted/50">
				<section className="container mx-auto px-4 py-20">
					<div className="mb-12 text-center">
						<h1 className="mb-4 font-bold text-4xl md:text-5xl">
							Simple, Transparent Pricing
						</h1>
						<p className="text-lg text-muted-foreground">
							Choose the plan that fits your needs
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle>Free</CardTitle>
								<CardDescription>Perfect for getting started</CardDescription>
								<div className="mt-4">
									<span className="font-bold text-4xl">$0</span>
									<span className="text-muted-foreground">/month</span>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<ul className="space-y-3">
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Up to 5 team members</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>1 organization</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Basic team management</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Email support</span>
									</li>
								</ul>
								<Link to="/login" className="mt-6 block">
									<Button className="w-full" variant="outline">
										Get Started
									</Button>
								</Link>
							</CardContent>
						</Card>

						<Card className="border-primary shadow-lg">
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>Startup</CardTitle>
									<Badge>Popular</Badge>
								</div>
								<CardDescription>
									For growing teams and organizations
								</CardDescription>
								<div className="mt-4">
									<span className="font-bold text-4xl">$29</span>
									<span className="text-muted-foreground">/month</span>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<ul className="space-y-3">
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Up to 50 team members</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Unlimited organizations</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Advanced team features</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Priority support</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Custom branding</span>
									</li>
								</ul>
								<Link to="/login" className="mt-6 block">
									<Button className="w-full">Get Started</Button>
								</Link>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Enterprise</CardTitle>
								<CardDescription>For large organizations</CardDescription>
								<div className="mt-4">
									<span className="font-bold text-4xl">$99</span>
									<span className="text-muted-foreground">/month</span>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<ul className="space-y-3">
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Unlimited team members</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Unlimited organizations</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Advanced analytics</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>24/7 dedicated support</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>Custom integrations</span>
									</li>
									<li className="flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										<span>SLA guarantee</span>
									</li>
								</ul>
								<Link to="/login" className="mt-6 block">
									<Button className="w-full" variant="outline">
										Contact Sales
									</Button>
								</Link>
							</CardContent>
						</Card>
					</div>

					<div className="mt-16 text-center">
						<h2 className="mb-4 font-semibold text-2xl">Need a custom plan?</h2>
						<p className="mb-6 text-muted-foreground">
							Contact us for enterprise solutions tailored to your needs
						</p>
						<Link to="/login">
							<Button size="lg">Contact Us</Button>
						</Link>
					</div>
				</section>
			</main>

			<footer className="border-t">
				<div className="container mx-auto px-4 py-8">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<div>
							<h3 className="font-semibold">SaaS Platform</h3>
							<p className="text-muted-foreground text-sm">
								© 2025 All rights reserved.
							</p>
						</div>
						<div className="flex gap-6">
							<Link
								to="/landing"
								className="text-muted-foreground text-sm hover:text-foreground"
							>
								Home
							</Link>
							<Link
								to="/pricing"
								className="text-muted-foreground text-sm hover:text-foreground"
							>
								Pricing
							</Link>
							<Link
								to="/about"
								className="text-muted-foreground text-sm hover:text-foreground"
							>
								About
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
