<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin SPI',
                'email' => 'admin@sikona.com',
                'password' => Hash::make('password'),
                'role' => 'manajemen',
                'sub_role' => 'admin',
                'department' => null,
                'biro' => null,
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'must_change_password' => false,
                'password_changed_at' => now(),
            ],
            [
                'name' => 'Kepala SPI',
                'email' => 'kspi@sikona.com',
                'password' => Hash::make('password'),
                'role' => 'manajemen',
                'sub_role' => 'kspi',
                'department' => null,
                'biro' => null,
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'must_change_password' => false,
                'password_changed_at' => now(),
            ],
            [
                'name' => 'Komite Audit',
                'email' => 'komite@sikona.com',
                'password' => Hash::make('password'),
                'role' => 'manajemen',
                'sub_role' => 'komite',
                'department' => null,
                'biro' => null,
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'must_change_password' => false,
                'password_changed_at' => now(),
            ],
            [
                'name' => 'Auditor Perencanaan',
                'email' => 'candit@sikona.com',
                'password' => Hash::make('password'),
                'role' => 'auditor',
                'sub_role' => null,
                'department' => null,
                'biro' => 'Perencanaan Audit',
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'must_change_password' => false,
                'password_changed_at' => now(),
            ],
            [
                'name' => 'Auditor Operasional',
                'email' => 'aopti@sikona.com',
                'password' => Hash::make('password'),
                'role' => 'auditor',
                'sub_role' => null,
                'department' => null,
                'biro' => 'Operasional & TI',
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'must_change_password' => false,
                'password_changed_at' => now(),
            ],
            [
                'name' => 'Auditor Keuangan',
                'email' => 'akfr@sikona.com',
                'password' => Hash::make('password'),
                'role' => 'auditor',
                'sub_role' => null,
                'department' => null,
                'biro' => 'Keuangan & Fraud',
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'must_change_password' => false,
                'password_changed_at' => now(),
            ],
            [
                'name' => 'John Doe',
                'email' => 'auditee1@sikona.com',
                'password' => Hash::make('password'),
                'role' => 'auditee',
                'sub_role' => null,
                'department' => 'Departemen Keuangan',
                'biro' => null,
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'must_change_password' => false,
                'password_changed_at' => now(),
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'auditee2@sikona.com',
                'password' => Hash::make('password'),
                'role' => 'auditee',
                'sub_role' => null,
                'department' => 'Departemen IT',
                'biro' => null,
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'must_change_password' => false,
                'password_changed_at' => now(),
            ],
            [
                'name' => 'Ahmad Rizki',
                'email' => 'auditee3@sikona.com',
                'password' => Hash::make('password'),
                'role' => 'auditee',
                'sub_role' => null,
                'department' => 'Departemen SDM',
                'biro' => null,
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'must_change_password' => false,
                'password_changed_at' => now(),
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }
    }
}
