import { Routes } from '@angular/router';
import { CodeGeneratorComponent } from './code-generator/code-generator.component';
import { CodeScannerComponent } from './code-scanner/code-scanner.component';
import { authGuard } from './auth.guard';
import { AuthComponent } from './auth/auth.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    {
        path:'',
        component: HomeComponent,
    },
    {
        path:'generate-tickets',
        component: CodeGeneratorComponent,
        canActivate: [authGuard],
    },
    {
        path:'scan-tickets',
        component: CodeScannerComponent
    },
    {
        path:'welcome',
        component: AuthComponent
    },
];
