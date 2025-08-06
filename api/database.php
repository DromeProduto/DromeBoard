<?php
class Database {
    private $host = 'aws-0-sa-east-1.pooler.supabase.com';
    private $port = '6543';
    private $db_name = 'postgres';
    private $username = 'postgres.etztlxlfgoqbgwyaozwf';
    private $password = 'DRom@29011725';
    private $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";sslmode=require";
            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT => 30
                ]
            );
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Erro de conexão com o banco de dados");
        }
        return $this->conn;
    }
}
?>