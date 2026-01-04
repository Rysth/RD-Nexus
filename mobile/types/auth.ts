export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  roles: string[];
}

export interface SignInForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  passwordConfirmation: string;
  fullName: string;
  username: string;
}
