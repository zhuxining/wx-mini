import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Building2,
	Lock,
	ShieldCheck,
	Users,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/(public)/landing/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<>
			<section className="container mx-auto px-4 py-20 md:py-32">
				<div className="mx-auto max-w-3xl text-center">
					<h1 className="mb-6 font-bold text-4xl tracking-tight md:text-6xl">
						Build Your Organization with
						<br className="hidden md:inline" />
						<span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							Powerful Teams
						</span>
					</h1>
					<p className="mb-8 text-lg text-muted-foreground md:text-xl">
						A comprehensive platform for managing organizations, teams, and
						members. Built for modern teams who need efficiency and simplicity.
					</p>
					<div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
						<Link to="/login" search={{ redirect: undefined }}>
							<Button size="lg" className="text-base">
								Sign Up Now
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						<Link to="/about">
							<Button size="lg" variant="outline" className="text-base">
								Learn More
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<section className="container mx-auto px-4 py-16">
				<div className="mb-12 text-center">
					<h2 className="mb-4 font-bold text-3xl md:text-4xl">
						Powered for Growth
					</h2>
					<p className="text-lg text-muted-foreground">
						Everything you need to manage your organization
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardContent className="flex flex-col items-start space-y-2 p-6">
							<div className="mb-4 rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
								<Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
							</div>
							<h3 className="font-semibold text-xl">Multi-Role Support</h3>
							<p className="text-muted-foreground">
								Admin, Organization, and Public interfaces tailored to each
								user's needs
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col items-start space-y-2 p-6">
							<div className="mb-4 rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
								<Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
							</div>
							<h3 className="font-semibold text-xl">Organization Management</h3>
							<p className="text-muted-foreground">
								Create and manage multiple organizations with complete control
								over settings and members
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col items-start space-y-2 p-6">
							<div className="mb-4 rounded-lg bg-green-100 p-3 dark:bg-green-900">
								<ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
							</div>
							<h3 className="font-semibold text-xl">Team Collaboration</h3>
							<p className="text-muted-foreground">
								Organize members into teams, assign roles, and manage
								permissions efficiently
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col items-start space-y-2 p-6">
							<div className="mb-4 rounded-lg bg-orange-100 p-3 dark:bg-orange-900">
								<Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
							</div>
							<h3 className="font-semibold text-xl">Lightning Fast</h3>
							<p className="text-muted-foreground">
								Built on modern tech stack for optimal performance and instant
								response times
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col items-start space-y-2 p-6">
							<div className="mb-4 rounded-lg bg-red-100 p-3 dark:bg-red-900">
								<Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
							</div>
							<h3 className="font-semibold text-xl">Secure by Design</h3>
							<p className="text-muted-foreground">
								Enterprise-grade security with role-based access control and
								encrypted data
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col items-start space-y-2 p-6">
							<div className="mb-4 rounded-lg bg-cyan-100 p-3 dark:bg-cyan-900">
								<ArrowRight className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
							</div>
							<h3 className="font-semibold text-xl">Invitation System</h3>
							<p className="text-muted-foreground">
								Easy member onboarding with secure invitation links and role
								assignments
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			<section className="bg-muted/50">
				<div className="container mx-auto px-4 py-16 text-center">
					<h2 className="mb-4 font-bold text-3xl md:text-4xl">
						Ready to Get Started?
					</h2>
					<p className="mb-8 text-lg text-muted-foreground">
						Join thousands of organizations already using our platform
					</p>
					<Link to="/login" search={{ redirect: undefined }}>
						<Button size="lg" className="text-lg">
							Start Your Free Trial
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</Link>
				</div>
			</section>
		</>
	);
}
