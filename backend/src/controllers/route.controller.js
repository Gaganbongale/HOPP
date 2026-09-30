const routeService = require('../services/route.service');
const { sendSuccess } = require('../utils/responseFormatter');
const brtsRoutes = require('../../../seeds-cleaned/routes.cleaned.json');

class RouteController {
  // OpenAPI Compliant Controllers
  async healthCheck(req, res, next) {
    try {
      const status = { status: 'healthy' };
      return res.status(200).json(
        sendSuccess(status, 'Health check passed')
      );
    } catch (error) {
      next(error);
    }
  }

  async planRoutes(req, res, next) {
    try {
      const { source, destination, preference } = req.body;
      const userId = req.user ? req.user._id : null;
      
      const result = await routeService.planRoutes(source, destination, preference, userId);
      return res.status(200).json(
        sendSuccess(result, 'Route planning completed successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getNetworkStats(req, res, next) {
    try {
      const stats = await routeService.getNetworkStats();
      return res.status(200).json(
        sendSuccess(stats, 'Network statistics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getBrtsRoutes(req, res, next) {
    try {
      const routes = brtsRoutes.filter((route) => route.transportType === 'BRTS').map(({ _id, routeNumber, source, destination, stops, verificationLevel }) => ({ id: _id, routeNumber, source, destination, stops, stopCount: stops.length, verificationLevel }));
      return res.status(200).json(sendSuccess(routes, 'BRTS routes retrieved successfully'));
    } catch (error) { next(error); }
  }

  async getNetworkNodes(req, res, next) {
    try {
      const nodes = await routeService.getNetworkNodes();
      return res.status(200).json(
        sendSuccess(nodes, 'Network nodes retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async searchStops(req, res, next) {
    try {
      const { q } = req.query;
      const stops = await routeService.searchStops(q);
      return res.status(200).json(
        sendSuccess(stops, 'Stops search completed successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async createFeedback(req, res, next) {
    try {
      const Feedback = require('../models/Feedback');
      const feedback = await Feedback.create(req.body);
      return res.status(201).json(
        sendSuccess(feedback, 'Feedback submitted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Legacy Controllers (Backwards-compatibility)
  async searchRoute(req, res, next) {
    try {
      const { source, destination } = req.body;
      const userId = req.user ? req.user._id : null;
      
      // Map to new planRoutes helper but return legacy format
      const plan = await routeService.planRoutes(source, destination, 'balanced', userId);
      const recOpt = plan.options[plan.recommended_index] || plan.options[0];

      const searchResult = {
        routeId: plan.options[0]?.id || 'route_id',
        source: plan.source_label,
        destination: plan.destination_label,
        distanceKm: recOpt ? recOpt.legs.reduce((acc, l) => acc + (l.distance_meters || 0), 0) / 1000 : 5,
        estimatedTime: recOpt ? recOpt.duration_min : 10,
        transportOptions: plan.options.map(opt => {
          let type = 'Bus';
          if (opt.tag === 'comfortable') type = 'Cab';
          else if (opt.tag === 'cheapest') type = 'Bus';
          else type = 'Auto';
          return {
            type,
            fare: opt.fare_inr,
            time: opt.duration_min
          };
        })
      };

      return res.status(200).json(
        sendSuccess(searchResult, 'Route search completed')
      );
    } catch (error) {
      next(error);
    }
  }

  async compareRoute(req, res, next) {
    try {
      const { source, destination } = req.query;
      
      const plan = await routeService.planRoutes(source, destination, 'balanced');
      
      const mapOption = (opt) => {
        let type = 'Bus';
        if (opt.tag === 'comfortable') type = 'Cab';
        else if (opt.tag === 'cheapest') type = 'Bus';
        else type = 'Auto';
        return {
          type,
          fare: opt.fare_inr,
          time: opt.duration_min
        };
      };

      const optComfortable = plan.options.find(o => o.tag === 'comfortable') || plan.options[0];
      const optFastest = plan.options.find(o => o.tag === 'fastest') || plan.options[0];
      const optCheapest = plan.options.find(o => o.tag === 'cheapest') || plan.options[0];

      const comparison = {
        cheapest: mapOption(optCheapest),
        fastest: mapOption(optComfortable),
        balanced: mapOption(optFastest)
      };

      return res.status(200).json(
        sendSuccess(comparison, 'Route comparison completed')
      );
    } catch (error) {
      next(error);
    }
  }

  async getPopularRoutes(req, res, next) {
    try {
      const popular = await routeService.getPopularRoutes();
      return res.status(200).json(
        sendSuccess(popular, 'Popular routes retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getRecentSearches(req, res, next) {
    try {
      const historyRepository = require('../repositories/history.repository');
      const userId = req.user._id;
      const recentSearches = await historyRepository.findByUserId(userId, 5);
      return res.status(200).json(
        sendSuccess(recentSearches, 'Recent searches retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await routeService.getDashboardStats();
      return res.status(200).json(
        sendSuccess(stats, 'Dashboard statistics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async createRoute(req, res, next) {
    try {
      const route = await routeService.createRoute(req.body);
      return res.status(201).json(
        sendSuccess(route, 'Route created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async updateRoute(req, res, next) {
    try {
      const route = await routeService.updateRoute(req.params.id, req.body);
      return res.status(200).json(
        sendSuccess(route, 'Route updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteRoute(req, res, next) {
    try {
      const route = await routeService.deleteRoute(req.params.id);
      return res.status(200).json(
        sendSuccess(route, 'Route deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RouteController();
