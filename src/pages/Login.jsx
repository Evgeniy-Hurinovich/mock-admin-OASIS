import styled from 'styled-components'
import LoginForm from '../features/authentication/LoginForm'
import Logo from '../ui/Logo'
import Heading from '../ui/Heading'
import { DEMO_MODE } from '../utils/constants'

const LoginLayout = styled.main`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 48rem;
  align-content: center;
  justify-content: center;
  gap: 3.2rem;
  background-color: var(--color-grey-50);
`

const DemoBadge = styled.p`
  text-align: center;
  font-size: 1.4rem;
  color: var(--color-grey-500);
  background-color: var(--color-grey-100);
  padding: 1rem 1.6rem;
  border-radius: var(--border-radius-sm);
`

function Login() {
  return (
    <LoginLayout>
      <Logo />
      <Heading as="h4">Добро пожаловать в Вашу учетную запись</Heading>
      {DEMO_MODE && (
        <DemoBadge>Демо-режим: данные хранятся локально в браузере</DemoBadge>
      )}
      <LoginForm />
    </LoginLayout>
  )
}

export default Login
