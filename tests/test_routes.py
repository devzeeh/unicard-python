import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_list_routes_returns_registered_endpoints(client):
    response = client.get('/routes')

    assert response.status_code == 200
    data = response.get_json()

    assert data['status'] == 'success'
    assert any(route['path'] == '/health' for route in data['data'])
    assert any(route['path'] == '/auth/login' for route in data['data'])
    assert any(route['path'] == '/api/transactions/process' for route in data['data'])
