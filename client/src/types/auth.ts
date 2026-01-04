export interface SignInForm {
	email: string;
	password: string;
}

export interface SignUpForm {
	fullName: string;
	username: string;
	email: string;
	password: string;
	passwordConfirmation: string;
}

export interface ConfirmForm {
	email: string;
}

export interface ForgotPasswordForm {
	email: string;
}

export interface ResetPasswordForm {
	password: string;
	passwordConfirmation: string;
}

export interface User {
	id: number;
	email: string;
	username: string;
	fullname: string;
	roles: string[]; // Add roles array
	verified: boolean;
	created_at: string;
	updated_at: string;
}
